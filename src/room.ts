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
import {Connection} from './connection';
import {RoomStateMessage, Message, RuleParameters, SystemMessage, Severity} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {intersection} from './util';
import {RULES} from './rules/active-rules';
import ErrorMessage from './lib/error';

const N_TAKE = 3;
const N_PLAY = 3;
const N_FIRST_HAND = 5;

export class Room {
	public id = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];
	public turn: Connection | null;
	public turnEndTime: number;

	public addConnection(conn: Connection) {
		if (this.connections.length === 0) {
			this.turn = conn;
			this.setTimer();
			this.dealCards(conn, N_TAKE);
		}

		// Push to front so new players get their turn last
		this.connections.unshift(conn);
		conn.room = this;
		this.dealCards(conn, N_FIRST_HAND);

		this.broadcast('info', global._('$[1] connected', conn.nickname));
	}

	public addRule(rule: Rule, parameters: RuleParameters) {
		if (this.turn!.nCardsPlayed === N_PLAY) {
			throw new ErrorMessage({message: 'Play limit reached', internal: false});
		}

		const filter = (r: EnabledRule) => intersection(rule.ruleCategories, r.rule.ruleCategories).size === 0;

		this.enabledRules.filter(r => !filter(r)).forEach(r => r.rule.ruleDisabled(this));
		rule.ruleEnabled(this);

		this.enabledRules = this.enabledRules.filter(filter);
		this.enabledRules.push(new EnabledRule(rule, parameters));

		this.turn!.hand.splice(this.turn!.hand.findIndex(ruleName => ruleName === rule.ruleName), 1);
		this.turn!.nCardsPlayed += 1;

		this.sendStateMessages();
		this.broadcast('info', global._('New rule: $[1]', rule.title));
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);

		this.turn = this.connections.length > 0
			? this.connections[index % this.connections.length]
			: null;

		this.broadcast('info', global._('$[1] disconnected', conn.nickname));
	}

	public broadcastMessage(msg: Message) {
		for (const conn of this.connections) {
			conn.sendMessage(msg);
		}
	}

	public broadcast(severity: Severity, message: string) {
		const msg: SystemMessage = {type: 'SYSTEM', message, severity};
		this.broadcastMessage(msg);
	}

	public setTimer() {
		const startTime = Date.now();
		this.turnEndTime = startTime + 120000;
		let counter: number = 120;
		const interval = setInterval(() => {
			counter--;
			if (counter < 0) {
				clearInterval(interval);
				const currentTurnIndex = this.connections.findIndex(conn => conn.id === this.turn!.id);
				const nextTurnIndex = (currentTurnIndex + 1) % this.connections.length;
				this.turn = this.connections[nextTurnIndex];
				this.dealCards(this.turn!, N_TAKE);
				this.turn!.nCardsPlayed = 0;
				this.setTimer();
				this.sendStateMessages();
			}
		}, 1000);
	}

	public sendStateMessages() {
		outer: for (const conn of this.connections) {
			let msg: RoomStateMessage = {...this.getStateMessage(), nickname: conn.nickname, userId: conn.id, hand: conn.getCardsInHand()};
			for (const rule of this.enabledRules) {
				const newMsg = rule.applyRoomStateMessage(msg, conn);
				if (!newMsg) { continue outer; }
				msg = newMsg;
			}
			conn.sendMessage(msg);
		}
	}

	private getStateMessage(): RoomStateMessage {
		return {
			type: 'ROOM_STATE',
			users: this.connections.map(conn => ({id: conn.id, nickname: conn.nickname, profileImg: conn.profileImg})),
			enabledRules: this.enabledRules.map(enabledRule => enabledRule.toJSON()),
			turnUserId: this.turn!.id,
			turnEndTime: this.turnEndTime,
			hand: [],
			nickname: '',
			userId: ''
		};
	}

	private dealCards(conn: Connection, numCards: number) {
		for (let i = 0; i < numCards; i++) {
			conn.hand.push(this.getRandomRuleName());
		}
	}

	private getRandomRuleName() {
		const randomNumber = Math.floor(Math.random() * Object.keys(RULES).length);
		return Object.keys(RULES)[randomNumber];
	}
}
