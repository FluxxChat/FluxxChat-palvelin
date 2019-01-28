import {Message} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';
import {Connection} from '../connection';

export class EnabledRule {
	public rule: Rule;
	public parameter: any;

	constructor(rule: Rule, parameter: any) {
		this.rule = rule;
		this.parameter = parameter;
	}

	public applyMessage(server: FluxxChatServer, message: Message, sender: Connection): Message | null {
		return this.rule.applyMessage(server, message, this.parameter, sender);
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

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: any, _sender: Connection): Message | null {
		return message;
	}
}

export class DisablingRule extends Rule {
	constructor(...categories: RuleCategory[]) {
		super();
		this.ruleCategories = new Set(categories);
	}
}

export type RuleCategory = 'ANONYMITY' | 'MESSAGE-LENGTH' | 'MUTE';
