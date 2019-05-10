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
import {Room, NumericalRoomParameter} from '../room';
import {RuleParameterTypes} from 'fluxxchat-protokolla';

export class RoomParameterRule extends RuleBase implements Rule {
	public parameterTypes = {value: 'number'} as RuleParameterTypes;
	private roomParameter: NumericalRoomParameter;

	constructor(roomParameter: NumericalRoomParameter, title: string, description: string, ruleName: string) {
		super();
		this.roomParameter = roomParameter;
		this.title = title;
		this.description = description;
		this.ruleName = ruleName;
	}

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		super.ruleEnabled(room, enabledRule);
		room[this.roomParameter] = enabledRule.parameters.value;
	}
}
