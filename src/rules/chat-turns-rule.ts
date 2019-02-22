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

import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class ChatTurnsRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set([RuleCategory.TURNS] as RuleCategory[]);
	public title = global._('Chat Turns');
	public description = global._('Players can only speak during their turn.');
	public ruleName = 'chat_turns';

	public isValidMessage(_server: FluxxChatServer, _message: Message, _parameter: any, sender: Connection) {
		if (!sender.room || !sender.room.turn) {
			return true;
		}
		return sender.id === sender.room.turn.id;
	}
}
