import {Message, Card, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
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

	public toJSON() {
		return {... this.rule.toJSON(), parameters: this.parameter};
	}
}

export interface Rule {
	ruleCategories: Set<RuleCategory>;
	title: string;
	description: string;
	ruleEnabled: () => void;
	ruleDisabled: () => void;
	applyMessage: (server: FluxxChatServer, message: Message, parameter: RuleParameters, sender: Connection) => Message | null;
	toJSON: () => Card;
}

export class RuleBase {
	public ruleCategories: Set<RuleCategory>;
	public title: string;
	public description: string;
	public ruleName: string;
	public parameterTypes: RuleParameterTypes = {};

	public ruleEnabled() {
		// Nothing
	}

	public ruleDisabled() {
		// Nothing
	}

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: RuleParameters, _sender: Connection): Message | null {
		return message;
	}

	public toJSON(): Card {
		return {
			name: this.title,
			description: this.description,
			ruleName: this.ruleName,
			parameterTypes: this.parameterTypes,
			parameters: {}
		};
	}
}

export class DisablingRule extends RuleBase implements Rule {
	public title = 'Disable';

	constructor(rules: Rule[], ruleName: string) {
		super();
		this.ruleCategories = new Set(rules.reduce((acc, rule) => acc.concat(Array.from(rule.ruleCategories)), [] as RuleCategory[]));
		this.description = `Disables the following rules: ${rules.map(rule => rule.title).join(', ')}.`;
		this.ruleName = ruleName;
	}
}

export enum RuleCategory {
	ANONYMITY = 'ANONYMITY',
	MESSAGELENGTH = 'MESSAGE-LENGTH',
	MUTE = 'MUTE'
}
