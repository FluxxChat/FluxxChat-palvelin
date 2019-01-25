import {Message, RoomCreatedMessage} from 'fluxxchat-protokolla';
import {EnabledRule} from './rules/rule';
import {Connection} from './connection';
import {Room} from './room';
import {intersection} from './util';
import {RULES} from './rules/active-rules';

export class FluxxChatServer {
	private enabledRules: EnabledRule[] = [];
	private connections: Connection[] = [];
	private rooms: { [id: string]: Room} = {};

	public handleMessage(conn: Connection, message: Message) {
		if (!conn.room) {
			if (message.type === 'JOIN_ROOM') {
				conn.nickname = message.nickname;
				if (this.rooms[message.roomId]) {
					const room = this.rooms[message.roomId];
					room.addConnection(conn);
					room.sendStateMessages();
				} else {
					console.log('Unknown room: ' + message.roomId); // tslint:disable-line:no-console
					return;
				}
			} else if (message.type === 'CREATE_ROOM') {
				const room = new Room();
				this.rooms[room.id] = room;
				conn.sendMessage({type: 'ROOM_CREATED', roomId: room.id} as RoomCreatedMessage);
				return;
			} else {
				console.log('Illegal message type in roomless state: ' + message.type); // tslint:disable-line:no-console
				return;
			}
			return;
		}

		// special code for the new rule message
		if (message.type === 'NEW_RULE') {
			if (RULES[message.ruleName]) {
				const newRule = RULES[message.ruleName];
				this.enabledRules = this.enabledRules.filter(r => intersection(newRule.ruleCategories, r.rule.ruleCategories).size === 0);
				this.enabledRules.push(new EnabledRule(newRule, null));
			} else {
				console.log('Unknown rule: ' + message.ruleName); // tslint:disable-line:no-console
				return;
			}
		}

		// main routine
		for (const rule of this.enabledRules) {
			message = rule.applyMessage(this, message);
		}

		for (const connection of conn.room.connections) {
			try {
				connection.sendMessage(message);
			} catch (err) {
				console.error(`Could not send message to client: ${err.message}`); // tslint:disable-line:no-console
			}
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
}
