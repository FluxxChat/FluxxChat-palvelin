import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import libvoikko from '../../lib/libvoikko';

const Libvoikko = libvoikko();

export class VerbLimitRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.VERB_NUMBER]);
	public title = global._('Minumum Verb Number');
	public description = global._('Sets the minumum number of verbs in message.');
	public ruleName = 'verb_limit';
	public parameterTypes = {number: 'number'} as RuleParameterTypes;

	private voikko?: libvoikko.Voikko;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, parameter: any, _sender: Connection): TextMessage | null {
		if (this.getNumberOfVerbs(message.textContent) < parameter.number) {
			return null;
		}
		return message;
	}

	private getNumberOfVerbs(message: string): number {
		if (!this.voikko) {
			this.voikko = Libvoikko.init('fi');
		}
		const tokens = this.voikko.tokens(message);
		let verbs = 0;
		for (const token of tokens) {
			if (token.type === 'WORD') {
				const a = this.voikko.analyze(token.text);
				const isVerb = a.some(info => info.CLASS === 'teonsana');
				if (isVerb) {
					verbs++;
				}
			}
		}
		return verbs;
	}
}
