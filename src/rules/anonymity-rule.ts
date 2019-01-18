import {Rule, RuleCategory} from './rule';
import {FluxxChatServer} from '../server';
import {Message} from 'fluxxchat-protokolla';

export class AnonymityRule implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['ANONYMITY'] as RuleCategory[]);

	public ruleEnabled(): void {
		// nothing to do
	}

	public ruleDisabled(): void {
		// nothing to do
	}

	public applyMessage(_server: FluxxChatServer, message: Message): Message {
		return {...message, senderNickname: '***'};
	}
}
