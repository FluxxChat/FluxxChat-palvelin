import uuid from 'uuid';
import {Connection} from './connection';
import {RoomStateMessage, TextMessage, Message, RuleParameters} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {intersection} from './util';
import {RULES} from './rules/active-rules';

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
		this.getStartingCards(conn);

		const msg: TextMessage = {type: 'TEXT', textContent: global._('$[1] connected', conn.nickname)};
		this.broadcastMessage(msg);
	}

	public addRule(rule: Rule, parameters: RuleParameters) {
		rule.ruleEnabled();
		this.enabledRules = this.enabledRules.filter(r => intersection(rule.ruleCategories, r.rule.ruleCategories).size === 0);
		this.enabledRules.push(new EnabledRule(rule, parameters));

		const currentTurnIndex = this.connections.findIndex(conn => conn.id === this.turn!.id);
		const nextTurnIndex = (currentTurnIndex + 1) % this.connections.length;
		this.turn = this.connections[nextTurnIndex];

		const user = this.connections[currentTurnIndex];
		user.sendMessage({type: 'CARD', card: {
			name: 'emptyHand',
			description: '',
			ruleName: '',
			parameterTypes: {'': ''},
			parameters: ['']
		}});
		let cardReplaced = false;
		user.hand.forEach(key => {
			if (cardReplaced === false && RULES[key] === rule) {
				const randomNumber = Math.floor(Math.random() * Math.floor(Object.keys(RULES).length));
				const newRuleKey = Object.keys(RULES).slice(randomNumber, randomNumber + 1)[0];
				user.hand[user.hand.indexOf(key)] = newRuleKey;
				cardReplaced = true;
			}
		});
		user.hand.forEach(key => {
			user.sendMessage({type: 'CARD', card: RULES[key].toJSON()});
		});

		this.sendStateMessages();
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);

		this.turn = this.connections.length > 0
			? this.connections[index % this.connections.length]
			: null;

		const msg: TextMessage = {type: 'TEXT', textContent: global._('$[1] disconnected', conn.nickname)};
		this.broadcastMessage(msg);
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

	public getStartingCards(conn: Connection) {
		for (let i = 0; i < 5; i++) {
			const randomNumber = Math.floor(Math.random() * Math.floor(Object.keys(RULES).length));
			const newRuleKey = Object.keys(RULES).slice(randomNumber, randomNumber + 1)[0];
			conn.hand.push(newRuleKey);
		}
	}
}
