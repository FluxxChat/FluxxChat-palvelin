import {Message, Card, RuleParameterTypes} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';

export class EnabledRule {
	public rule: Rule;
	public parameter: any;

	constructor(rule: Rule, parameter: any) {
		this.rule = rule;
		this.parameter = parameter;
	}

	public toJSON() {
		return {... this.rule.toJSON(), parameters: this.parameter};
	}

	public applyMessage(server: FluxxChatServer, message: Message): Message {
		return this.rule.applyMessage(server, message, this.parameter);
	}
}

export interface Rule {
	ruleCategories: Set<RuleCategory>;
	title: string;
	description: string;
	ruleEnabled: () => void;
	ruleDisabled: () => void;
	applyMessage: (server: FluxxChatServer, message: Message, parameter: any) => Message;
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

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: any): Message {
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
	public ruleCategories;
	public title = 'Disable';
	public description;
	public parameterTypes = {playButton: ''} as RuleParameterTypes;

	constructor(rules: Rule[], ruleName: string) {
		super();
		this.ruleCategories = new Set(rules.reduce((acc, rule) => acc.concat(rule), [] as Rule[]));
		this.description = `Disables the following rules:\n ${rules.map(rule => rule.title).join(', ')}.`;
		this.ruleName = ruleName;
	}
}

export enum RuleCategory {
	ANONYMITY = 'ANONYMITY',
	MESSAGELENGTH = 'MESSAGE-LENGTH'
}
