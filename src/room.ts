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
import {RULES} from './rules/active-rules';
import ErrorMessage from './lib/error';
import * as events from './event-models';

const N_TAKE = 3;
const N_PLAY = 3;
const N_FIRST_HAND = 5;

export class Room {
	public id = uuid.v4();
	public stateId = uuid.v4();
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
		conn.nCardsPlayed = 0;
		this.dealCards(conn, N_FIRST_HAND);

		this.broadcast('info', 'server.userConnected', {nickname: conn.nickname});
		events.UserEvent.insert({id: conn.id, name: conn.nickname, connected: true});
	}

	public addRule(rule: Rule, parameters: RuleParameters) {
		if (this.turn!.nCardsPlayed === N_PLAY) {
			throw new ErrorMessage({message: 'Play limit reached', internal: false});
		}

		const enabledRule = new EnabledRule(rule, parameters);
		this.enabledRules.push(enabledRule);
		rule.ruleEnabled(this, enabledRule);

		this.turn!.hand.splice(this.turn!.hand.findIndex(ruleName => ruleName === rule.ruleName), 1);
		this.turn!.nCardsPlayed += 1;

		this.sendStateMessages();
		this.broadcast('info', 'server.newRule', {title: rule.title});

		events.ActiveRuleEvent.insert({
			ruleName: rule.ruleName,
			parameters: JSON.stringify(parameters),
			roomStateId: this.stateId,
			userId: this.turn!.id
		});
	}

	public removeRule(rule: EnabledRule) {
		rule.rule.ruleDisabled(this, rule);
		this.enabledRules.splice(this.enabledRules.indexOf(rule), 1);
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);

		this.turn = this.connections.length > 0
			? this.connections[index % this.connections.length]
			: null;

		this.broadcast('info', 'server.userDisconnected', {nickname: conn.nickname});
		events.UserEvent.insert({id: conn.id, name: conn.nickname, connected: false});
	}

	public broadcastMessage(msg: Message) {
		for (const conn of this.connections) {
			conn.sendMessage(msg);
		}
	}

	public broadcast(severity: Severity, message: string, values: { [key: string]: string } | undefined) {
		const msg: SystemMessage = {type: 'SYSTEM', message, severity, values};
		this.broadcastMessage(msg);
	}

	public setTimer() {
		const startTime = Date.now();
		this.turnEndTime = startTime + 120000;
		let counter: number = 120;
		const interval = setInterval(() => {
			counter--;
			if (counter < 0 && this.connections.length > 0) {
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
		if (this.connections.length === 0) {
			return;
		}

		this.stateId = uuid.v4();
		const stateMessage = this.getStateMessage();

		events.RoomStateEvent.insert({id: this.stateId, roomId: this.id, turnUserId: this.turn!.id});

		outer: for (const conn of this.connections) {
			let msg: RoomStateMessage = {...stateMessage, nickname: conn.nickname, userId: conn.id, hand: conn.getCardsInHand()};
			for (const rule of this.enabledRules) {
				const newMsg = rule.applyRoomStateMessage(msg, conn);
				if (!newMsg) { continue outer; }
				msg = newMsg;
			}
			conn.sendMessage(msg);
			events.RoomStateUserEvent.insert({roomStateId: this.stateId, userId: conn.id});
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
			userId: '',
			playableCardsLeft: N_PLAY - this.turn!.nCardsPlayed,
			variables: {
				inputMinHeight: 1,
				imageMessages: false
			}
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
