/* FluxxChat-palvelin
 * Copyright (C) 2019 Helsingin yliopisto
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import uuid from 'uuid';
import {Message, RoomCreatedMessage, RuleParameters, TextMessage} from 'fluxxchat-protokolla';
import {Connection} from './connection';
import {Room} from './room';
import {RULES} from './rules/active-rules';
import {Rule} from './rules/rule';
import ErrorMessage from './lib/error';
import * as events from './event-models';

const EVENT_FLUSH_INTERVAL_MS = 10 * 1000;

export class FluxxChatServer {
	private connections: Connection[] = [];
	private rooms: {[id: string]: Room} = {};

	public constructor() {
		setInterval(events.flushEvents, EVENT_FLUSH_INTERVAL_MS);

		// Log available rules
		for (const rule of Object.values(RULES)) {
			events.RuleEvent.insert({name: rule.ruleName});
		}
	}

	public handleMessage(conn: Connection, message: Message) {
		switch (message.type) {
			case 'JOIN_ROOM':
				return this.joinRoom(conn, message.roomId, message.nickname);
			case 'CREATE_ROOM':
				return this.createRoom(conn);
			case 'LEAVE_ROOM':
				return this.removeConnection(conn);
			case 'PROFILE_IMG_CHANGE':
				return this.changeProfileImage(conn, message.profileImg);
			default:
				if (!conn.room) {
					throw new ErrorMessage({internal: true, message: 'Must be connected to a room'});
				}
				break;
		}

		if (message.type === 'NEW_RULE') {
			this.enactRule(conn, message.ruleName, message.ruleParameters);
		}

		if (message.type === 'TEXT') {
			message.senderNickname = conn.nickname;
			message.senderId = conn.id;
			message.timestamp = new Date().toISOString();

			const blockingRules: string[] = [];
			const enabledRules = conn.room.enabledRules;

			// Temporary message variable might be set to null, even though original message cannot be null
			let newMessage: TextMessage | null = message;

			// Check message validity and apply transforms
			for (const rule of enabledRules) {
				if (!rule.isValidMessage(message, conn)) {
					blockingRules.push(rule.rule.title);
				}

				newMessage = rule.applyTextMessage(message, conn);
				if (newMessage === null) {
					break;
				}
			}

			const isMessageValid = blockingRules.length === 0 && newMessage !== null;

			events.ChatMessageEvent.insert({
				id: uuid.v4(),
				roomStateId: conn.room!.stateId,
				userId: conn.id,
				userVisibleName: conn.nickname,
				content: message.textContent,
				draft: message.validateOnly
			});

			if (message.validateOnly) {
				// This message is a draft. Return validity response to client.
				return conn.sendMessage({
					type: 'VALIDATE_TEXT_RESPONSE',
					invalidReason: isMessageValid ? undefined : blockingRules,
					valid: isMessageValid
				});
			}

			if (!isMessageValid) {
				throw new Error('Message disallowed by rules');
			}

			// Assign temporary message variable to the original message. We know `newMessage` is not null.
			message = newMessage!;
		}

		for (const connection of conn.room.connections) {
			connection.sendMessage(message);
		}

		// remove closed connections
		this.connections = this.connections.filter(c => !c.closed);
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);
		if (conn.room) {
			conn.room.removeConnection(conn);
			conn.room.sendStateMessages();
		}
	}

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.onMessage((_, message) => this.handleMessage(conn, message));
		conn.onClose(() => this.removeConnection(conn));
	}

	private validateRuleParameters(conn: Connection, rule: Rule, ruleParameters: RuleParameters) {
		const params = {};

		for (const key of Object.keys(rule.parameterTypes)) {
			const type = rule.parameterTypes[key];
			const value = ruleParameters[key];

			if (!value) {
				throw new ErrorMessage({internal: true, message: `Required parameter: ${key}`});
			}

			if (type === 'number') {
				if (isNaN(Number(value))) {
					throw new ErrorMessage({internal: true, message: `Parameter ${key} must be numeric`});
				}

				params[key] = Number(value);
			} else if (type === 'player') {
				if (!conn.room || !conn.room.connections.find(c => c.id === value)) {
					throw new ErrorMessage({internal: true, message: 'Invalid target'});
				}

				params[key] = value;
			} else {
				params[key] = value;
			}
		}

		return params;
	}

	private enactRule(conn: Connection, ruleName: string, ruleParameters: RuleParameters) {
		if (!conn.room) {
			throw new ErrorMessage({internal: true, message: 'Must be connected to a room'});
		}

		if (!conn.room.turn || conn.room.turn.id !== conn.id) {
			throw new ErrorMessage({internal: true, message: 'You can only play cards on your turn'});
		}

		events.PlayedCardEvent.insert({roomStateId: conn.room.stateId, ruleName, userId: conn.id});

		const rule = RULES[ruleName];
		if (!rule) {
			throw new ErrorMessage({internal: true, message: `No such rule: ${ruleName}`});
		}

		const parameters = this.validateRuleParameters(conn, rule, ruleParameters);

		conn.room.addRule(rule, parameters);
	}

	private createRoom(conn: Connection) {
		const room = new Room();
		this.rooms[room.id] = room;

		events.RoomEvent.insert({id: room.id});

		conn.sendMessage({type: 'ROOM_CREATED', roomId: room.id} as RoomCreatedMessage);
	}

	private joinRoom(conn: Connection, roomId: string, requestedNickname: string) {
		const room = this.rooms[roomId];

		if (room) {
			if (room.connections.find(c => c.nickname === requestedNickname)) {
				throw new ErrorMessage({internal: false, message: `Nickname taken: ${requestedNickname}`});
			}

			if (conn.room) {
				conn.room.removeConnection(conn);
			}

			conn.nickname = requestedNickname;

			room.addConnection(conn);
			room.sendStateMessages();
		} else {
			throw new ErrorMessage({internal: false, message: `Room does not exist, id: ${roomId}`});
		}
	}

	private changeProfileImage(conn: Connection, profileImg: string) {
		conn.profileImg = profileImg;
		if (conn.room) {
			conn.room.sendStateMessages();
		}
	}
}
