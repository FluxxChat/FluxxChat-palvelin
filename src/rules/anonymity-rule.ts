import {Rule, RuleCategory} from './rule';
import {FluxxChatServer} from '../server';
import {Message} from 'fluxxchat-protokolla';

export class AnonymityRule extends Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['ANONYMITY'] as RuleCategory[]);

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: any): Message {
		if (message.type === 'TEXT') {
			return {...message, senderNickname: '***'};
		}
		return message;
	}
}
