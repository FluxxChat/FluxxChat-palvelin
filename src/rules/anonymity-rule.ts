import {Rule, RuleCategory} from './rule';
import {FluxxChatServer} from '../server';
import {Message, TextMessage} from 'fluxxchat-protokolla';

export class AnonymityRule extends Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['ANONYMITY'] as RuleCategory[]);

	public applyMessage(_server: FluxxChatServer, message: Message): Message {
		if (message.type === 'TEXT') {
			return {...message, senderNickname: '***'} as TextMessage;
		}
		return message;
	}
}
