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
import {RoomStateMessage, RoomParameters, Message, RuleParameters, SystemMessage, Severity, ServerStateMessage} from 'fluxxchat-protokolla';
import {EnabledRule, Rule} from './rules/rule';
import {RULES} from './rules/active-rules';
import {enabledRuleFromCard} from './util';
import ErrorMessage from './lib/error';
import * as events from './event-models';
import yaml from 'js-yaml';
import fs from 'fs';

let serverConfig: ServerStateMessage = {type: 'SERVER_STATE'};

try {
	serverConfig = yaml.safeLoad(fs.readFileSync('server-config.yaml', 'utf8'));
} catch (e) {
	console.log('Failed to load server settings:'); // tslint:disable-line:no-console
	console.log(e); // tslint:disable-line:no-console
}

const DEFAULT_SERVER_STATE = serverConfig;
const DEFAULT_TURN_LENGTH = ((DEFAULT_SERVER_STATE.defaultRoomParameters && DEFAULT_SERVER_STATE.defaultRoomParameters.turnLength) ? DEFAULT_SERVER_STATE.defaultRoomParameters.turnLength : 120); // in seconds
const DEFAULT_N_STARTING_HAND = ((DEFAULT_SERVER_STATE.defaultRoomParameters && DEFAULT_SERVER_STATE.defaultRoomParameters.nStartingHand) ? DEFAULT_SERVER_STATE.defaultRoomParameters.nStartingHand : 5);
const DEFAULT_N_DRAW = ((DEFAULT_SERVER_STATE.defaultRoomParameters && DEFAULT_SERVER_STATE.defaultRoomParameters.nDraw) ? DEFAULT_SERVER_STATE.defaultRoomParameters.nDraw : 3);
const DEFAULT_N_PLAY = ((DEFAULT_SERVER_STATE.defaultRoomParameters && DEFAULT_SERVER_STATE.defaultRoomParameters.nPlay) ? DEFAULT_SERVER_STATE.defaultRoomParameters.nPlay : 3);
const DEFAULT_N_MAX_HAND = ((DEFAULT_SERVER_STATE.defaultRoomParameters && DEFAULT_SERVER_STATE.defaultRoomParameters.nMaxHand) ? DEFAULT_SERVER_STATE.defaultRoomParameters.nMaxHand : null);

export class Room {
	public id = uuid.v4();
	public stateId = uuid.v4();
	public connections: Connection[] = [];
	public enabledRules: EnabledRule[] = [];
	public activePlayer: Connection | null;
	public turnTimer: NodeJS.Timeout;
	public turnEndTime: number;
	public turnLength: number = DEFAULT_TURN_LENGTH;
	public nStartingHand: number = DEFAULT_N_STARTING_HAND;
	public nDraw: number = DEFAULT_N_DRAW;
	public nPlay: number = DEFAULT_N_PLAY;
	public nMaxHand: number | null = DEFAULT_N_MAX_HAND; // null indicates no hand limit
	public cardDistribution: string[];

	constructor(params?: RoomParameters) {

		this.cardDistribution = [];

		if (params) {
			if (params.turnLength) { this.turnLength = Math.max(1, params.turnLength); }
			if (params.nStartingHand) { this.nStartingHand = Math.max(0, params.nStartingHand); }
			if (params.nDraw) { this.nDraw = Math.max(0, params.nDraw); }
			if (params.nPlay) { this.nPlay = Math.max(0, params.nPlay); }
			if (params.nMaxHand) { this.nMaxHand = Math.max(0, params.nMaxHand); }
			if (params.deck) { this.cardDistribution = this.getDistribution(params.deck); }
			if (params.startingRules) { this.enabledRules.concat(params.startingRules.map(card => enabledRuleFromCard(card))); }
		}

		// default card distribution for when no deck is specified
		if (!params || !params.deck) {
			for (const ruleName of Object.keys(RULES)) {
				this.cardDistribution.push(ruleName);
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
		for (let i = 0; i < numCards; i++) {
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
