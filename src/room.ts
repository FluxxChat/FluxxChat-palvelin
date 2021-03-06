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
import {RoomStateMessage, RoomParameters, Message, RuleParameters, SystemMessage, Severity} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {RULES} from './rules/active-rules';
import {enabledRuleFromCard} from './util';
import ErrorMessage from './lib/error';
import * as events from './event-models';

// a list of fields of Room that are numerical and can be changed by the RoomParameterRule
export type NumericalRoomParameter = 'turnLength' | 'nStartingHand' | 'nDraw' | 'nPlay' | 'nMaxHand';

export class Room {
	public id = uuid.v4();
	public stateId = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];
	public activePlayer: Connection | null;
	public turnTimer: NodeJS.Timeout;
	public turnEndTime: number;
	public turnLength: number;
	public nStartingHand: number;
	public nDraw: number;
	public nPlay: number;
	public nMaxHand: number | null; // null indicates no hand limit
	public cardDistribution: string[];

	constructor(params: RoomParameters) {

		// the one's with exclamation points need to be defined in defaultDefaultRoomParameters
		this.turnLength = Math.max(1, params.turnLength!);
		this.nStartingHand = Math.max(0, params.nStartingHand!);
		this.nDraw = Math.max(0, params.nDraw!);
		this.nPlay = Math.max(0, params.nPlay!);
		this.nMaxHand = params.nMaxHand ? Math.max(0, params.nMaxHand) : null;
		if (params.deck) {
			this.cardDistribution = this.getDistribution(params.deck);
		} else {
			// default card distribution for when no deck is specified
			this.cardDistribution = [];
			for (const ruleName of Object.keys(RULES)) {
				this.cardDistribution.push(ruleName);
			}
		}

		if (params.startingRules) {
			for (const card of params.startingRules) {
				const enabledStartingRule = enabledRuleFromCard(card);
				this.enabledRules.push(enabledStartingRule);
				RULES[card.ruleName].ruleEnabled(this, enabledStartingRule);
			}
		}
	}

	public addConnection(newPlayer: Connection) {

		if (this.connections.length === 0) {
			this.activePlayer = newPlayer;
			this.setTimer();
			this.dealCards(newPlayer, this.nDraw);
		}

		// Insert new player into turn order before active player
		const currentTurnIndex = this.connections.findIndex(c => c.id === this.activePlayer!.id);
		this.connections.splice(currentTurnIndex, 0, newPlayer);

		newPlayer.room = this;
		newPlayer.nCardsPlayed = 0;
		this.dealCards(newPlayer, this.nStartingHand);

		this.broadcast('info', 'server.userConnected', {nickname: newPlayer.nickname});
	}

	public addRule(rule: Rule, parameters: RuleParameters) {
		if (this.activePlayer !== undefined && this.activePlayer!.nCardsPlayed === this.nPlay) {
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

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		if (this.activePlayer === conn) {
			clearInterval(this.turnTimer);
			if (this.connections.length > 1) {
				this.giveTurn(this.connections[(index + 1) % this.connections.length]);
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
		this.dealCards(this.activePlayer!, this.nDraw);
		this.activePlayer!.nCardsPlayed = 0;
		this.setTimer();
		this.sendStateMessages();
	}

	public sendStateMessages() {
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
					userId: (enabledRule.playedBy ? enabledRule.playedBy.id : null),
					createdAt: new Date().toISOString()
				})
			);
		}

		dbInserts.push(
			events.RoomStateEvent.query().insert({
				id: this.stateId,
				roomId: this.id,
				turnUserId: this.activePlayer ? this.activePlayer.id : undefined,
				createdAt: new Date().toISOString()
			})
		);

		// Wait for database insertions to finish
		Promise.all(dbInserts);
	}

	private getStateMessage(): RoomStateMessage {
		return {
			type: 'ROOM_STATE',
			users: this.connections.map(conn => ({id: conn.id, nickname: conn.nickname, profileImg: conn.profileImg})),
			enabledRules: this.enabledRules.map(enabledRule => enabledRule.toJSON()),
			turnUserId: this.activePlayer ? this.activePlayer.id : '',
			turnEndTime: this.turnEndTime,
			turnLength: this.turnLength,
			hand: [],
			nickname: '',
			userId: '',
			playableCardsLeft: this.activePlayer ? this.nPlay - this.activePlayer.nCardsPlayed : 0,
			variables: {
				inputMinHeight: 1,
				imageMessages: false
			}
		};
	}

	private dealCards(conn: Connection, numCards: number) {
		for (let i = 0; i < numCards && (this.nMaxHand === null || conn.hand.length < this.nMaxHand!); i++) {
			conn.hand.push(this.getRandomRuleName());
		}
	}

	private getRandomRuleName() {
		const randomNumber = Math.floor(Math.random() * this.cardDistribution.length);
		return this.cardDistribution[randomNumber];
	}

	private getDistribution(deck: {[ruleName: string]: number}): string[] {
		const distribution: string[] = [];

		for (const ruleName of Object.keys(deck)) {
			for (let i = 0; i < deck[ruleName]; i++) {
				distribution.push(ruleName);
			}
		}
		return distribution;
	}
}
