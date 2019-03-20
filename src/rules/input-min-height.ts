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

import {RuleBase, EnabledRule} from './rule';
import {RuleParameters, RoomStateMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import {Room} from '../room';

export class InputMinHeight extends RuleBase {
	public title = 'rule.inputMinHeight.title';
	public description = 'rule.inputMinHeight.description';
	public ruleName = 'input_min_height';
	public parameterTypes = {height: 'number'} as RuleParameterTypes;

	public ruleEnabled(room: Room, enabledRule: EnabledRule) {
		room.enabledRules.filter(r => r.rule === this && r !== enabledRule).forEach(room.removeRule.bind(room));
		if (enabledRule.parameters.height < 1) {
			enabledRule.parameters.height = 1;
		} else if (enabledRule.parameters.height > 25) {
			enabledRule.parameters.height = 25;
		}
	}

	public applyRoomStateMessage(parameters: RuleParameters, message: RoomStateMessage, conn: Connection): RoomStateMessage {
		return {...message, variables: {...message.variables, inputMinHeight: parameters.height}};
	}
}
