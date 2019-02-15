import {Message, Card, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
import {FluxxChatServer} from '../server';
import {Connection} from '../connection';
import {Room} from '../room';

export class EnabledRule {
	public rule: Rule;
	public parameter: RuleParameters;

	constructor(rule: Rule, parameter: RuleParameters) {
		this.rule = rule;
		this.parameter = parameter;
	}

	public applyMessage(server: FluxxChatServer, message: Message, sender: Connection) {
		return this.rule.applyMessage(server, message, this.parameter, sender);
	}

	public isValidMessage(server: FluxxChatServer, message: Message, sender: Connection) {
		return this.rule.isValidMessage(server, message, this.parameter, sender);
	}

	public toJSON() {
		return {...this.rule.toJSON(), parameters: this.parameter};
	}
}

export interface Rule {
	ruleCategories: Set<RuleCategory>;
	title: string;
	description: string;
	ruleName: string;
	parameterTypes: RuleParameterTypes;
	ruleEnabled: (room: Room) => void;
	ruleDisabled: (room: Room) => void;
	applyMessage: (server: FluxxChatServer, message: Message, parameter: RuleParameters, sender: Connection) => Message | null;
	isValidMessage: (server: FluxxChatServer, message: Message, parameter: RuleParameters, sender: Connection) => boolean;
	toJSON: () => Card;
}

export class RuleBase {
	public ruleCategories: Set<RuleCategory>;
	public title: string;
	public description: string;
	public ruleName: string;
	public parameterTypes: RuleParameterTypes = {};

	public ruleEnabled(_room: Room) {
		// Nothing
	}

	public ruleDisabled(_room: Room) {
		// Nothing
	}

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: RuleParameters, _sender: Connection) {
		return message;
	}

	public isValidMessage(_server: FluxxChatServer, _message: Message, _parameter: RuleParameters, _sender: Connection) {
		return true;
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
	public title;

	constructor(rules: Rule[], ruleName: string, ruleTitle: string) {
		super();
		this.title = ruleTitle;
		this.ruleCategories = new Set(rules.reduce((acc, rule) => acc.concat(Array.from(rule.ruleCategories)), [] as RuleCategory[]));
		this.description = global._('Disables the following rules: $[1].', rules.map(rule => rule.title).join(', '));
		this.ruleName = ruleName;
	}
}

export enum RuleCategory {
	ANONYMITY = 'ANONYMITY',
	MESSAGELENGTH = 'MESSAGE-LENGTH',
	MUTE = 'MUTE',
	FORMATTING = 'FORMATTING'
}
