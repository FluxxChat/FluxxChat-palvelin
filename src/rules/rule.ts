import {Message} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';
import {AnonymityRule} from '././anonymity-rule';

export class Rule {
	public ruleCategories: Set<RuleCategory>;

	public ruleEnabled(): void {
		// do nothing as default
	}

	public ruleDisabled(): void {
		// do nothing as default
	}

	public applyMessage(server: FluxxChatServer, message: Message): Message {
		return message;
	}
}

export class DisablingRule extends Rule {
	constructor(...categories: RuleCategory[]) {
		super();
		this.ruleCategories = new Set(categories);
	}
}

export type RuleCategory = 'ANONYMITY' | 'MESSAGE-LENGTH';

export const RULES: { [ruleName: string]: Rule } = {
	anonymity: new AnonymityRule(),
	no_anonymity: new DisablingRule('ANONYMITY'),
	disable_all: new DisablingRule('ANONYMITY')
};
