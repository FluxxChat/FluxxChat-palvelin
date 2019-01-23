import {Rule, RuleCategory} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage} from 'fluxxchat-protokolla';

export class MessageLengthRule extends Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['MESSAGE-LENGTH'] as RuleCategory[]);

	public applyMessage(_server: FluxxChatServer, message: TextMessage): TextMessage {
		if (message.textContent.length >= 10) {
			return {...message, senderNickname: message.senderNickname, textContent: message.textContent.substring(0, 10)};
		}
		return message;
	}
}
