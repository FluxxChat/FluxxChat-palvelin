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
import {TextMessage, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import libvoikko from '../../lib/libvoikko';

const Libvoikko = libvoikko();

export class HaikuRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.METRE]);
	public title = 'rule.haiku.title';
	public description = 'rule.haiku.description';
	public ruleName = 'haiku';
	private voikko?: libvoikko.Voikko;

	public isValidMessage(_parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		if (!this.voikko) {
			this.voikko = Libvoikko.init('fi');
		}
		const syllableCounts = message.textContent
			.split(/\/|\n/)
			.map(verse => verse.trim())
			.map(v => this.voikko!.hyphenate(v).split('-'))
			.map(verse => verse.length);
		
		return syllableCounts.length === 3 && [5, 7, 5].every((v, i) => v === syllableCounts[i]);
	}
}
