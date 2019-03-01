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

export class HaikuRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.METRE]);
	public title = global._('Messages must be Haikus');
	public description = global._('All messages must have 3 verses (separated by / or new line) with 5, 7, and 5 syllables.');
	public ruleName = 'haiku';

	public isValidMessage(_parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		const syllableCounts = message.textContent
			.split(/\/|\n/)
			.map(verse => verse.trim())
			.map(splitSyllables)
			.map(verse => verse.length);
		
		return syllableCounts.length === 3 && [5, 7, 5].every((v, i) => v === syllableCounts[i]);
	}
}

function splitSyllables(text: string): string[] {
	const vowels = 'aeiouyäöå';
	const consontants = 'bcdfghjklmnpqrstvwxz';
	const ans: string[] = [];
	let i: number;
	let j = 0;
	const split = () => {
		const word = text.substring(j, i).trim();
		if (word) { ans.push(word); }
		j = i;
	};
	for (i = 0; i < text.length; i++) {
		const before = text.substring(0, i);
		const after = text.substring(i);
		if (before.length >= 1 && after.length >= 2) {
			const b1 = before.charAt(before.length - 1);
			if ((vowels + consontants).includes(b1) && consontants.includes(after.charAt(0)) && vowels.includes(after.charAt(1))) {
				split();
				continue;
			}
		}
		if (before.length >= 1 && after.length >= 1) {
			const b1 = before.charAt(before.length - 1);
			if (vowels.includes(b1) && b1 !== 'a' && after.charAt(0) === 'a') {
				split();
				continue;
			}
			if (vowels.includes(b1) && b1 !== 'o' && after.charAt(0) === 'o') {
				split();
				continue;
			}
		}
		if (after && after.charAt(0).match(/[\s–\-']/)) {
			split();
			continue;
		}
	}
	split();
	return ans;
}
