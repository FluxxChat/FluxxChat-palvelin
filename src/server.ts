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
import {Message, RoomCreatedMessage, RuleParameters, TextMessage, SystemMessage} from 'fluxxchat-protokolla';
import {Connection} from './connection';
import {Room} from './room';
import {RULES} from './rules/active-rules';
import {Rule} from './rules/rule';
import ErrorMessage from './lib/error';
import localeMessages from './i18n/data.json';
import * as events from './event-models';
import * as tf from '@tensorflow/tfjs';
import FImodelJSON from './models/FI/model.json';
import ENmodelJSON from './models/EN/model.json';

export class FluxxChatServer {
	private connections: Connection[] = [];
	private rooms: {[id: string]: Room} = {};
	private modelFI: tf.Sequential;
	private modelEN: tf.Sequential;

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
			case 'CLIENT_LANGUAGE_CHANGE':
				conn.clientLanguage = message.language;
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
			if (message.textContent.startsWith('/')) {
				// Cheating commands are always valid
				if (message.validateOnly) {
					return conn.sendMessage({
						type: 'VALIDATE_TEXT_RESPONSE',
						valid: true
					});
				} else {
					return this.applyCheat(message.textContent.substring(1), conn);
				}
			}

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

				newMessage = rule.applyTextMessage(newMessage, conn);
				if (newMessage === null) {
					break;
				}
			}

			const isMessageValid = blockingRules.length === 0 && newMessage !== null;

			events.ChatMessageEvent.query().insert({
				id: uuid.v4(),
				roomStateId: conn.room!.stateId,
				userId: conn.id,
				userVisibleNickname: newMessage ? newMessage.senderNickname : message.senderNickname,
				content: message.textContent,
				draft: message.validateOnly,
				valid: isMessageValid,
				invalidReason: isMessageValid ? undefined : JSON.stringify(blockingRules),
				createdAt: new Date().toISOString()
			}).execute();

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
		const room = conn.room;
		if (room) {
			room.removeConnection(conn);
			room.sendStateMessages();

			if (room.connections.length === 0) {
				this.removeRoom(room);
			}
		}
	}

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.onMessage((_, message) => this.handleMessage(conn, message));
		conn.onClose(() => this.removeConnection(conn));
		conn.sendMessage({type: 'LANGUAGE_DATA', messages: localeMessages});
	}

	public async initializeModels() {
		const fs = require('fs');
		fs.readFile('./src/models/FI/group1-shard1of3.bin', (err1: any, data1: Buffer) => {
			if (err1) { throw err1; }
			fs.readFile('./src/models/FI/group1-shard2of3.bin', (err2: any, data2: Buffer) => {
				if (err2) { throw err2; }
				fs.readFile('./src/models/FI/group1-shard3of3.bin', (err3: any, data3: Buffer) => {
					if (err3) { throw err3; }
					const weightBuffer = Buffer.concat([data1, data2, data3]).buffer;
					const weightsManifestEntries: tf.io.WeightsManifestEntry[] = [];
					FImodelJSON.weightsManifest[0].weights.forEach((entry: tf.io.WeightsManifestEntry) => {
						weightsManifestEntries.push({name: entry.name, shape: entry.shape, dtype: 'float32'});
					});
					const assignModel = async (weightData: ArrayBuffer) => {
						this.modelFI = await tf.loadLayersModel(tf.io.fromMemory(
							FImodelJSON.modelTopology,
							weightsManifestEntries,
							weightData
						)) as tf.Sequential;
					};
					assignModel(weightBuffer as ArrayBuffer);
				});
			});
		});
		fs.readFile('./src/models/EN/group1-shard1of2.bin', (err1: any, data1: Buffer) => {
			if (err1) { throw err1; }
			fs.readFile('./src/models/EN/group1-shard2of2.bin', (err2: any, data2: Buffer) => {
				if (err2) { throw err2; }
				const weightBuffer = Buffer.concat([data1, data2]).buffer;
				const weightsManifestEntries: tf.io.WeightsManifestEntry[] = [];
				ENmodelJSON.weightsManifest[0].weights.forEach((entry: tf.io.WeightsManifestEntry) => {
					weightsManifestEntries.push({name: entry.name, shape: entry.shape, dtype: 'float32'});
				});
				const assignModel = async (weightData: ArrayBuffer) => {
					this.modelEN = await tf.loadLayersModel(tf.io.fromMemory(
						ENmodelJSON.modelTopology,
						weightsManifestEntries,
						weightData
					)) as tf.Sequential;
				};
				assignModel(weightBuffer as ArrayBuffer);
			});
		});
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
			} else if (Array.isArray(type)) {
				if (!type.includes(value)) {
					throw new ErrorMessage({internal: true, message: 'Invalid value'});
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

		if (!conn.room.activePlayer || conn.room.activePlayer.id !== conn.id) {
			throw new ErrorMessage({internal: true, message: 'You can only play cards on your turn'});
		}

		const rule = RULES[ruleName];
		if (!rule) {
			throw new ErrorMessage({internal: true, message: `No such rule: ${ruleName}`});
		}

		const parameters = this.validateRuleParameters(conn, rule, ruleParameters);

		conn.room.addRule(rule, parameters);
	}

	private createRoom(conn: Connection) {
		if (conn.room) { return; }

		const room = new Room(this.modelFI, this.modelEN);
		this.rooms[room.id] = room;

		events.RoomEvent.query().insert({
			id: room.id,
			availableRules: JSON.stringify(Object.keys(RULES)),
			createdAt: new Date().toISOString()
		}).execute();

		conn.sendMessage({type: 'ROOM_CREATED', roomId: room.id} as RoomCreatedMessage);
	}

	private removeRoom(room: Room) {
		delete this.rooms[room.id];

		events.RoomEvent.query().patchAndFetchById(room.id, {
			removedAt: new Date().toISOString()
		}).execute();
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

	private applyCheat(command: string, conn: Connection): void {
		const args = command.split(' ');
		switch (args[0]) {
		case 'get':
			if (args.length !== 2 || !Object.keys(RULES).includes(args[1])) {
				return this.sendCheatUsage('get', conn);
			}
			conn.hand.push(args[1]);
			conn.room!.sendStateMessages();
			break;
		case 'resetcounter':
			if (args.length !== 1) {
				return this.sendCheatUsage('resetcounter', conn);
			}
			conn.nCardsPlayed = 0;
			conn.room!.sendStateMessages();
			break;
		case 'nextplayer':
			if (args.length !== 1) {
				return this.sendCheatUsage('nextplayer', conn);
			}
			conn.room!.nextTurn();
			conn.room!.sendStateMessages();
			break;
		case 'help':
			if (args.length !== 2) {
				return this.sendCheatUsage('help', conn);
			}
			return this.sendCheatUsage(args[1], conn);
		default:
			return this.sendCheatUsage('unknown', conn);
		}
	}

	private sendCheatUsage(cheat: string, conn: Connection): void {
		const usage: SystemMessage = {type: 'SYSTEM', severity: 'warning', message: `cheat.${cheat}.usage`};
		conn.sendMessage(usage);
	}
}
