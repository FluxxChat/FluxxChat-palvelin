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

import {Rule, RuleBase} from './rule';
import {RuleParameters, RoomStateMessage} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class NoRemovingRule extends RuleBase implements Rule {
	public title = 'rule.noRemoving.title';
	public description = 'rule.noRemoving.description';
	public ruleName = 'no_removing';

	public applyRoomStateMessage(_parameters: RuleParameters, message: RoomStateMessage, _conn: Connection): RoomStateMessage {
		return {...message, variables: {...message.variables, disableBackspace: false}};
	}
}
