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
import {Message, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import {Room} from '../room';

export class MuteRule extends RuleBase implements Rule {
	public title = global._('Mute Player');
	public description = global._('Mutes a specific player.');
	public ruleName = 'mute';
	public parameterTypes = {target: 'player'} as RuleParameterTypes;

	public isValidMessage(parameter: RuleParameters, _message: Message, sender: Connection) {
		return sender.id !== parameter.target;
	}

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		room.enabledRules
			.filter(r => r.rule === this && r.parameters.target === enabledRule.parameters.target)
			.forEach(room.removeRule.bind(room));
	}
}
