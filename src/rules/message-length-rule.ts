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

import {Rule, RuleBase, EnabledRule} from './rule';
import {TextMessage, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import {Room} from '../room';

class MessageLengthRule extends RuleBase {
	public parameterTypes = {length: 'number'} as RuleParameterTypes;
}

export class MessageMaxLengthRule extends MessageLengthRule implements Rule {
	public title = global._('Message Maximum Length Limit');
	public description = global._('Restricts message maximum length.');
	public ruleName = 'message_max_length';

	public isValidMessage(parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		return message.textContent.length <= parameters.length;
	}

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		super.ruleEnabled(room, enabledRule);
		room.enabledRules
			.filter(r => r.rule.ruleName === 'message_min_length' && r.parameters.length > enabledRule.parameters.length)
			.forEach(room.removeRule);
	}
}

export class MessageMinLengthRule extends MessageLengthRule implements Rule {
	public title = global._('Message Minimum Length Limit');
	public description = global._('Restricts message minimum length.');
	public ruleName = 'message_min_length';

	public isValidMessage(parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		return message.textContent.length >= parameters.length;
	}

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		super.ruleEnabled(room, enabledRule);
		room.enabledRules
			.filter(r => r.rule.ruleName === 'message_max_length' && r.parameters.length < enabledRule.parameters.length)
			.forEach(room.removeRule);
	}
}
