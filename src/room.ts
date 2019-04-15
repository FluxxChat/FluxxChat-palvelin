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
const TURN_LENGTH = 120; // in seconds

export class Room {
	public id = uuid.v4();
	public stateId = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];
	public activePlayer: Connection | null;
	public turnTimer: NodeJS.Timeout;
	public turnEndTime: number;
	public turnLength: number = TURN_LENGTH;

	public async addConnection(newPlayer: Connection) {
		if (this.connections.length === 0) {
			this.activePlayer = newPlayer;
			this.setTimer();
			this.dealCards(newPlayer, N_TAKE);
		}

		// Insert new player into turn order before active player
		const currentTurnIndex = this.connections.findIndex(conn => conn.id === this.activePlayer!.id);
		this.connections.splice(currentTurnIndex, 0, newPlayer);

		newPlayer.room = this;
		newPlayer.nCardsPlayed = 0;
		this.dealCards(newPlayer, N_FIRST_HAND);

		this.broadcast('info', 'server.userConnected', {nickname: newPlayer.nickname});
	}

	public async addRule(rule: Rule, parameters: RuleParameters) {
		if (this.activePlayer!.nCardsPlayed === N_PLAY) {
			throw new ErrorMessage({message: 'Play limit reached', internal: false});
		}

		const enabledRule = new EnabledRule(rule, parameters, this.activePlayer!);
		this.enabledRules.push(enabledRule);
		rule.ruleEnabled(this, enabledRule);

		this.activePlayer!.hand.splice(this.activePlayer!.hand.findIndex(ruleName => ruleName === rule.ruleName), 1);
		this.activePlayer!.nCardsPlayed += 1;

		this.sendStateMessages();
		this.broadcast('info', 'server.newRule', {title: rule.title});
	}

	public removeRule(rule: EnabledRule) {
		rule.rule.ruleDisabled(this, rule);
		this.enabledRules.splice(this.enabledRules.indexOf(rule), 1);
	}

	public async removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		if (this.activePlayer === conn) {
			clearInterval(this.turnTimer);
			if (this.connections.length > 1) {
				this.activePlayer = this.connections[(index + 1) % this.connections.length];
				this.dealCards(this.activePlayer!, N_TAKE);
				this.activePlayer!.nCardsPlayed = 0;
				this.setTimer();
			} else {
				this.activePlayer = null;
			}
		}
		this.connections.splice(index, 1);

		this.activePlayer = this.connections.length > 0
			? this.connections[index % this.connections.length]
			: null;

		this.broadcast('info', 'server.userDisconnected', {nickname: conn.nickname});
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
		this.turnEndTime = startTime + this.turnLength * 1000;
		let counter: number = this.turnLength;
		this.turnTimer = setInterval(() => {
			counter--;
			if (counter < 0 && this.connections.length > 0) {
				this.nextTurn();
			}
		}, 1000);
	}

	public nextTurn() {
		const currentTurnIndex = this.connections.findIndex(conn => conn.id === this.activePlayer!.id);
		const nextTurnIndex = (currentTurnIndex + 1) % this.connections.length;
		this.giveTurn(this.connections[nextTurnIndex]);
	}
	
	public giveTurn(nextInTurn: Connection) {
		clearInterval(this.turnTimer);
		this.activePlayer = nextInTurn;
		this.dealCards(this.activePlayer!, N_TAKE);
		this.activePlayer!.nCardsPlayed = 0;
		this.setTimer();
		this.sendStateMessages();
	}

	public async sendStateMessages() {
		if (this.connections.length === 0) {
			return;
		}

		this.stateId = uuid.v4();
		const stateMessage = this.getStateMessage();

		for (const conn of this.connections) {
			let msg: RoomStateMessage | null = {...stateMessage, nickname: conn.nickname, userId: conn.id, hand: conn.getCardsInHand()};

			for (const rule of this.enabledRules) {
				msg = rule.applyRoomStateMessage(msg, conn);
				if (!msg) {
					break;
				}
			}

			if (msg) {
				conn.sendMessage(msg);
			}
		}

		const dbInserts: Array<Promise<any>> = [];

		for (const conn of this.connections) {
			dbInserts.push(
				events.RoomStateUserEvent.query().insert({
					id: uuid.v4(),
					userId: conn.id,
					nickname: conn.nickname,
					hand: JSON.stringify(conn.hand),
					roomStateId: this.stateId,
					createdAt: new Date().toISOString()
				})
			);
		}

		for (const enabledRule of this.enabledRules) {
			dbInserts.push(
				events.ActiveRuleEvent.query().insert({
					id: uuid.v4(),
					ruleName: enabledRule.rule.ruleName,
					parameters: JSON.stringify(enabledRule.parameters),
					roomStateId: this.stateId,
					userId: enabledRule.playedBy.id,
					createdAt: new Date().toISOString()
				})
			);
		}

		dbInserts.push(
			events.RoomStateEvent.query().insert({
				id: this.stateId,
				roomId: this.id,
				turnUserId: this.activePlayer!.id,
				createdAt: new Date().toISOString()
			})
		);

		// Wait for database insertions to finish
		await Promise.all(dbInserts);
	}

	private getStateMessage(): RoomStateMessage {
		return {
			type: 'ROOM_STATE',
			users: this.connections.map(conn => ({id: conn.id, nickname: conn.nickname, profileImg: conn.profileImg})),
			enabledRules: this.enabledRules.map(enabledRule => enabledRule.toJSON()),
			turnUserId: this.activePlayer!.id,
			turnEndTime: this.turnEndTime,
			turnLength: this.turnLength,
			hand: [],
			nickname: '',
			userId: '',
			playableCardsLeft: N_PLAY - this.activePlayer!.nCardsPlayed,
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
