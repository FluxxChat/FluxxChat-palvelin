import uuid from 'uuid';
import {Connection} from './connection';
import {RoomStateMessage, User, TextMessage, Message} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {intersection} from './util';

export class Room {
	public id = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.room = this;

		const msg: TextMessage = {type: 'TEXT', textContent: `${conn.nickname} connected`};
		this.broadcastMessage(msg);
	}

	public addRule(rule: Rule) {
		this.enabledRules = this.enabledRules.filter(r => intersection(rule.ruleCategories, r.rule.ruleCategories).size === 0);
		this.enabledRules.push(new EnabledRule(rule, null));
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);

		const msg: TextMessage = {type: 'TEXT', textContent: `${conn.nickname} disconnected`};
		this.broadcastMessage(msg);
	}

	public sendStateMessages() {
		this.broadcastMessage(this.getStateMessage());
	}

	public getStateMessage(): RoomStateMessage {
		const users: User[] = this.connections.map(conn => ({id: conn.id, nickname: conn.nickname}));
		return {
			type: 'ROOM_STATE',
			users
		};
	}

	public broadcastMessage(msg: Message) {
		for (const conn of this.connections) {
			conn.sendMessage(msg);
		}
	}
}
