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

import {Message, RoomCreatedMessage, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from './connection';
import {Room} from './room';
import {RULES} from './rules/active-rules';
import {Rule} from './rules/rule';

export class FluxxChatServer {
	private connections: Connection[] = [];
	private rooms: {[id: string]: Room} = {};

	public handleMessage(conn: Connection, message: Message) {
		switch (message.type) {
			case 'JOIN_ROOM':
				return this.joinRoom(conn, message.roomId, message.nickname);
			case 'CREATE_ROOM':
				return this.createRoom(conn);
			case 'LEAVE_ROOM':
				return this.removeConnection(conn);
			default:
				if (!conn.room) {
					throw new Error('Must be connected to a room');
				}
				break;
		}

		if (message.type === 'NEW_RULE') {
			this.enactRule(conn, message.ruleName, message.ruleParameters);
		}

		if (message.type === 'VALIDATE_TEXT') {
			for (const rule of conn.room.enabledRules) {
				if (!rule.isValidMessage(this, message, conn)) {
					return conn.sendMessage({
						type: 'VALIDATE_TEXT_RESPONSE',
						valid: false,
						invalidReason: rule.rule.title
					});
				}
			}

			return conn.sendMessage({
				type: 'VALIDATE_TEXT_RESPONSE',
				valid: true
			});
		}

		if (message.type === 'TEXT') {
			message.senderNickname = conn.visibleNickname;
		}

		for (const rule of conn.room.enabledRules) {
			if (!rule.isValidMessage(this, message, conn)) {
				throw new Error('Message disallowed by rules');
			}

			const newMessage = rule.applyMessage(this, message, conn);
			if (!newMessage) {
				return; // message removed
			} else {
				message = newMessage;
			}
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
				throw new Error(`Required parameter: ${key}`);
			}

			if (type === 'number') {
				if (isNaN(Number(value))) {
					throw new Error(`Parameter ${key} must be numeric`);
				}

				params[key] = Number(value);
			} else if (type === 'player') {
				if (!conn.room || !conn.room.connections.find(c => c.id === value)) {
					throw new Error('Invalid target');
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
			throw new Error('Must be connected to a room');
		}

		if (!conn.room.turn || conn.room.turn.id !== conn.id) {
			throw new Error('You can only play cards on your turn');
		}

		const rule = RULES[ruleName];
		if (!rule) {
			throw new Error(`No such rule: ${ruleName}`);
		}

		const parameters = this.validateRuleParameters(conn, rule, ruleParameters);

		conn.room.addRule(rule, parameters);
	}

	private createRoom(conn: Connection) {
		const room = new Room();
		this.rooms[room.id] = room;
		conn.sendMessage({type: 'ROOM_CREATED', roomId: room.id} as RoomCreatedMessage);
	}

	private joinRoom(conn: Connection, roomId: string, requestedNickname: string) {
		const room = this.rooms[roomId];

		if (room) {
			if (room.connections.find(c => c.nickname === requestedNickname)) {
				// Someone else already has the requested nickname in this room
				throw new Error(`Nickname taken: ${requestedNickname}`);
			}

			if (conn.room) {
				conn.room.removeConnection(conn);
			}

			conn.nickname = requestedNickname;
			conn.visibleNickname = requestedNickname;
			room.addConnection(conn);
			room.sendStateMessages();
			conn.hand.forEach(key => {
				conn.sendMessage({type: 'CARD', card: RULES[key].toJSON()});
			});
		} else {
			throw new Error(`Room does not exist: ${roomId}`);
		}
	}
}
