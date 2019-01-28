import {Message} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';

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

export interface Rule {
	ruleCategories: Set<RuleCategory>;
	title: string;
	description: string;
	ruleEnabled: () => void;
	ruleDisabled: () => void;
	applyMessage: (server: FluxxChatServer, message: Message, parameter: any) => Message;
	toJSON: () => {
		ruleCategories: RuleCategory[];
		title: string;
		description: string;
	};
}

export class RuleBase {
	public ruleCategories: Set<RuleCategory>;
	public title: string;
	public description: string;

	public ruleEnabled() {
		// Nothing
	}

	public ruleDisabled() {
		// Nothing
	}

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: any): Message {
		return message;
	}

	public toJSON() {
		return {
			ruleCategories: [...this.ruleCategories],
			title: this.title,
			description: this.description
		};
	}
}

export class DisablingRule extends RuleBase implements Rule {
	public ruleCategories;
	public title = 'Disable';
	public description;

	constructor(rules: Rule[]) {
		super();
		this.ruleCategories = new Set(rules.map(rule => rule.ruleCategories));
		this.description = `Disables the following rules: ${rules.map(rule => rule.title).join(', ')}.`;
	}
}

export enum RuleCategory {
	ANONYMITY = 'ANONYMITY',
	MESSAGELENGTH = 'MESSAGE-LENGTH'
}
