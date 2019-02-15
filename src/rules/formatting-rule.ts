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
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MarkdownRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.FORMATTING]);
	public title = global._('MarkDown Formatting');
	public description = global._('All messages are rendered as MarkDown.');
	public ruleName = 'markdown_formatting';
	public parameterTypes = {} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, _parameter: any, _sender: Connection) {
		message.markdown = true;
		return message;
	}
}
