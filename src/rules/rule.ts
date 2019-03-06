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

import {Card, RuleParameterTypes, RuleParameters, RoomStateMessage, TextMessage} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import {Room} from '../room';

export class EnabledRule {
	public rule: Rule;
	public parameters: RuleParameters;

	constructor(rule: Rule, parameter: RuleParameters) {
		this.rule = rule;
		this.parameters = parameter;
	}

	public applyTextMessage(message: TextMessage, sender: Connection) {
		return this.rule.applyTextMessage(this.parameters, message, sender);
	}

	public applyRoomStateMessage(message: RoomStateMessage, receiver: Connection) {
		return this.rule.applyRoomStateMessage(this.parameters, message, receiver);
	}

	public isValidMessage(message: TextMessage, sender: Connection) {
		return this.rule.isValidMessage(this.parameters, message, sender);
	}

	public toJSON() {
		return {...this.rule.toJSON(), parameters: this.parameters};
	}
}

export interface Rule {
	ruleCategories: Set<RuleCategory>;
	title: string;
	description: string;
	ruleName: string;
	parameterTypes: RuleParameterTypes;
	ruleEnabled: (room: Room) => void;
	ruleDisabled: (room: Room) => void;
	applyTextMessage: (parameter: RuleParameters, message: TextMessage, sender: Connection) => TextMessage | null;
	applyRoomStateMessage: (parameter: RuleParameters, message: RoomStateMessage, receiver: Connection) => RoomStateMessage | null;
	isValidMessage: (parameter: RuleParameters, message: TextMessage, sender: Connection) => boolean;
	toJSON: () => Card;
}

export class RuleBase {
	public ruleCategories: Set<RuleCategory>;
	public title: string;
	public description: string;
	public ruleName: string;
	public parameterTypes: RuleParameterTypes = {};

	public ruleEnabled(_room: Room) {
		// Nothing
	}

	public ruleDisabled(_room: Room) {
		// Nothing
	}

	public applyTextMessage(_parameter: RuleParameters, message: TextMessage, _sender: Connection) {
		return message;
	}

	public applyRoomStateMessage(_parameter: RuleParameters, message: RoomStateMessage, _receiver: Connection) {
		return message;
	}

	public isValidMessage(_parameter: RuleParameters, _message: TextMessage, _sender: Connection) {
		return true;
	}

	public toJSON(): Card {
		return {
			name: this.title,
			description: this.description,
			ruleName: this.ruleName,
			parameterTypes: this.parameterTypes,
			parameters: {}
		};
	}
}

export class DisablingRule extends RuleBase implements Rule {
	constructor(rules: Rule[], ruleName: string, ruleTitle: string) {
		super();
		this.title = ruleTitle;
		this.ruleCategories = new Set(rules.reduce((acc, rule) => acc.concat(Array.from(rule.ruleCategories)), [] as RuleCategory[]));
		this.description = global._('Disables the following rules: $[1].', rules.map(rule => rule.title).join(', '));
		this.ruleName = ruleName;
	}
}

export enum RuleCategory {
	ANONYMITY = 'ANONYMITY',
	MESSAGELENGTH = 'MESSAGE-LENGTH',
	MUTE = 'MUTE',
	FORMATTING = 'FORMATTING',
	POS_LIMIT = 'POS_LIMIT',
	TURNS = 'TURN',
	METRE = 'METRE'
}
