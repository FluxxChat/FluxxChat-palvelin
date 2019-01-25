import {Message} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';
import {AnonymityRule} from '././anonymity-rule';
import {MessageLengthRule} from './message-length-rule';

export class EnabledRule {
	public rule: Rule;
	public parameter: any;

	constructor(rule: Rule, parameter: any) {
		this.rule = rule;
		this.parameter = parameter;
	}

	public applyMessage(server: FluxxChatServer, message: Message): Message {
		return this.rule.applyMessage(server, message, this.parameter);
	}
}

export class Rule {
	public ruleCategories: Set<RuleCategory>;

	public ruleEnabled(): void {
		// do nothing as default
	}

	public ruleDisabled(): void {
		// do nothing as default
	}

	public applyMessage(server: FluxxChatServer, message: Message, parameter: any): Message {
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

	message_length: new MessageLengthRule(),
	no_message_length: new DisablingRule('MESSAGE-LENGTH'),

	disable_all: new DisablingRule('ANONYMITY')
};
