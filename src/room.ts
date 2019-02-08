import uuid from 'uuid';
import {Connection} from './connection';
import {RoomStateMessage, Message, RuleParameters, SystemMessage} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {intersection} from './util';

export class Room {
	public id = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];
	public turn: Connection | null;

	public addConnection(conn: Connection) {
		if (this.connections.length === 0) {
			this.turn = conn;
		}

		// Push to front so new players get their turn last
		this.connections.unshift(conn);
		conn.room = this;

		this.broadcast(global._('$[1] connected', conn.nickname));
	}

	public addRule(rule: Rule, parameters: RuleParameters) {
		this.enabledRules = this.enabledRules.filter(r => intersection(rule.ruleCategories, r.rule.ruleCategories).size === 0);
		this.enabledRules.push(new EnabledRule(rule, parameters));

		const currentTurnIndex = this.connections.findIndex(conn => conn.id === this.turn!.id);
		const nextTurnIndex = (currentTurnIndex + 1) % this.connections.length;
		this.turn = this.connections[nextTurnIndex];

		this.sendStateMessages();
		this.broadcast(global._('New rule: $[1]', rule.title));
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);

		this.turn = this.connections.length > 0
			? this.connections[index % this.connections.length]
			: null;

		this.broadcast(global._('$[1] disconnected', conn.nickname));
	}

	public sendStateMessages() {
		if (this.connections.length > 0) {
			this.broadcastMessage(this.getStateMessage());
		}
	}

	public getStateMessage(): RoomStateMessage {
		return {
			type: 'ROOM_STATE',
			users: this.connections.map(conn => ({id: conn.id, nickname: conn.nickname})),
			enabledRules: this.enabledRules.map(enabledRule => enabledRule.toJSON()),
			turnUserId: this.turn!.id
		};
	}

	public broadcastMessage(msg: Message) {
		for (const conn of this.connections) {
			conn.sendMessage(msg);
		}
	}

	public broadcast(text: string) {
		const msg: SystemMessage = {type: 'SYSTEM', message: text};
		this.broadcastMessage(msg);
	}
}
