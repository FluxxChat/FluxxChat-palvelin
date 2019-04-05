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
	public playedBy: Connection;

	constructor(rule: Rule, parameter: RuleParameters, playedBy: Connection) {
		this.rule = rule;
		this.parameters = parameter;
		this.playedBy = playedBy;
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
	title: string;
	description: string;
	ruleName: string;
	parameterTypes: RuleParameterTypes;
	values?: { [key: string]: string };
	ruleEnabled: (room: Room, enabledRule: EnabledRule) => void;
	ruleDisabled: (room: Room, enabledRule: EnabledRule) => void;
	applyTextMessage: (parameter: RuleParameters, message: TextMessage, sender: Connection) => TextMessage | null;
	applyRoomStateMessage: (parameter: RuleParameters, message: RoomStateMessage, receiver: Connection) => RoomStateMessage | null;
	isValidMessage: (parameter: RuleParameters, message: TextMessage, sender: Connection) => boolean;
	toJSON: () => Card;
}

export class RuleBase {
	public title: string;
	public description: string;
	public ruleName: string;
	public parameterTypes: RuleParameterTypes = {};
	public values?: { [key: string]: string };

	public ruleEnabled(room: Room, enabledRule: EnabledRule) {
		room.enabledRules.filter(r => r.rule === this && r !== enabledRule).forEach(room.removeRule.bind(room));
	}

	public ruleDisabled(_room: Room, _enabledRule: EnabledRule) {
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
			parameters: {},
			values: this.values
		};
	}
}

export class DisablingRule extends RuleBase implements Rule {
	public filter: (r: EnabledRule) => boolean;

	constructor(filter: Rule[] | ((r: EnabledRule) => boolean), ruleName: string, ruleTitle: string, ruleDesc?: string) {
		super();
		this.title = ruleTitle;
		this.ruleName = ruleName;
		if (Array.isArray(filter)) {
			this.filter = r => filter.includes(r.rule);
			this.description = 'rule.disablingRule.description';
			this.values = {array: filter.map(rule => rule.title).join(', ')};
		} else {
			this.filter = filter;
			this.description = ruleDesc || '';
		}
	}

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		room.enabledRules
			.filter(r => r === enabledRule || this.filter(r))
			.forEach(room.removeRule.bind(room));
	}
}
