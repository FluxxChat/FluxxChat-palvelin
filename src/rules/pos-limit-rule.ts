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
import posjs from 'pos';
import libvoikko from '../../lib/libvoikko';

const Libvoikko = libvoikko();

const VOIKKO_POS_IDS: {[pos: string]: string[]} = {
	verb: ['teonsana'],
	noun: ['nimisana'],
	adjective: ['laatusana', 'nimisana_laatusana']
};

const POSJS_POS_IDS: {[pos: string]: posjs.POS[]} = {
	verb: ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'],
	noun: ['NN', 'NNS'],
	adjective: ['JJ', 'JJR', 'JJS']
};

class BasePosLimitRule extends RuleBase {
	private voikko?: libvoikko.Voikko;
	private lexer = new posjs.Lexer();
	private tagger = new posjs.Tagger();

	public ruleEnabled(room: Room, enabledRule: EnabledRule): void {
		room.enabledRules
			.filter(r => r.rule === this && r.parameters.pos === enabledRule.parameters.pos && r !== enabledRule)
			.forEach(room.removeRule.bind(room));
	}

	protected getNumberOfWordsWithPos(message: string, pos: keyof typeof VOIKKO_POS_IDS | keyof typeof POSJS_POS_IDS): number {
		return this.tagWithVoikko(message, pos) + this.tagWithPosjs(message, pos);
	}

	private tagWithVoikko(message: string, pos: keyof typeof VOIKKO_POS_IDS): number {
		if (!this.voikko) {
			this.voikko = Libvoikko.init('fi');
		}
		const voikkopos = VOIKKO_POS_IDS[pos];
		const tokens = this.voikko.tokens(message);
		let words = 0;
		for (const token of tokens) {
			if (token.type === 'WORD') {
				const a = this.voikko.analyze(token.text);
				const isVerb = a.some(info => voikkopos.includes(info.CLASS));
				if (isVerb) {
					words++;
				}
			}
		}
		return words;
	}

	private tagWithPosjs(message: string, pos: keyof typeof POSJS_POS_IDS): number {
		const posjspos = POSJS_POS_IDS[pos];
		const tokens = this.tagger.tag(this.lexer.lex(message));
		let words = 0;
		for (const token of tokens) {
			if (posjspos.includes(token[1])) {
				words++;
			}
		}
		return words;
	}
}

export class PosMinLimitRule extends BasePosLimitRule implements Rule {
	public title = global._('Minumum Number of Verbs/Nouns/Adjectives');
	public description = global._('Sets the minumum number of verbs/nouns/adjectives in message.');
	public ruleName = 'pos_min_limit';
	public parameterTypes = {pos: Object.keys(VOIKKO_POS_IDS), number: 'number'} as RuleParameterTypes;

	public isValidMessage(parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		return this.getNumberOfWordsWithPos(message.textContent, parameters.pos) >= parameters.number;
	}
}

export class PosMaxLimitRule extends BasePosLimitRule implements Rule {
	public title = global._('Maximum Number of Verbs/Nouns/Adjectives');
	public description = global._('Sets the maximum number of verbs/nouns/adjectives in message.');
	public ruleName = 'pos_max_limit';
	public parameterTypes = {pos: Object.keys(VOIKKO_POS_IDS), number: 'number'} as RuleParameterTypes;

	public isValidMessage(parameters: RuleParameters, message: TextMessage, _sender: Connection) {
		return this.getNumberOfWordsWithPos(message.textContent, parameters.pos) <= parameters.number;
	}
}
