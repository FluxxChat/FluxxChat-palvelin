import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import libvoikko from '../../lib/libvoikko';

const Libvoikko = libvoikko();

const VOIKKO_POS_IDS = {
	verb: ['teonsana'],
	noun: ['nimisana'],
	adjective: ['laatusana', 'nimisana_laatusana']
};

class BasePosLimitRule extends RuleBase {
	public ruleCategories = new Set([RuleCategory.POS_LIMIT]);

	private voikko?: libvoikko.Voikko;

	protected getNumberOfWordsWithPos(message: string, pos: keyof typeof VOIKKO_POS_IDS): number {
		if (!this.voikko) {
			this.voikko = Libvoikko.init('fi');
		}
		const voikkopos = VOIKKO_POS_IDS[pos];
		const tokens = this.voikko.tokens(message);
		let verbs = 0;
		for (const token of tokens) {
			if (token.type === 'WORD') {
				const a = this.voikko.analyze(token.text);
				const isVerb = a.some(info => voikkopos.includes(info.CLASS));
				if (isVerb) {
					verbs++;
				}
			}
		}
		return verbs;
	}
}

export class PosMinLimitRule extends BasePosLimitRule implements Rule {
	public title = global._('Minumum Number of Verbs/Nouns/Adjectives');
	public description = global._('Sets the minumum number of verbs/nouns/adjectives in message.');
	public ruleName = 'pos_min_limit';
	public parameterTypes = {pos: Object.keys(VOIKKO_POS_IDS), number: 'number'} as RuleParameterTypes;

	public isValidMessage(_server: FluxxChatServer, message: TextMessage, parameter: RuleParameters, _sender: Connection) {
		return this.getNumberOfWordsWithPos(message.textContent, parameter.pos) >= parameter.number;
	}
}

export class PosMaxLimitRule extends BasePosLimitRule implements Rule {
	public title = global._('Maximum Number of Verbs/Nouns/Adjectives');
	public description = global._('Sets the maximum number of verbs/nouns/adjectives in message.');
	public ruleName = 'pos_max_limit';
	public parameterTypes = {pos: Object.keys(VOIKKO_POS_IDS), number: 'number'} as RuleParameterTypes;

	public isValidMessage(_server: FluxxChatServer, message: TextMessage, parameter: RuleParameters, _sender: Connection) {
		return this.getNumberOfWordsWithPos(message.textContent, parameter.pos) <= parameter.number;
	}
}
