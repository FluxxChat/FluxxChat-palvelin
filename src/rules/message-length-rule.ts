import {Rule, RuleCategory} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage} from 'fluxxchat-protokolla';
import {isNumber} from 'util';

export class MessageLengthRule extends Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['MESSAGE-LENGTH'] as RuleCategory[]);

	public applyMessage(_server: FluxxChatServer, message: TextMessage, parameter: any): TextMessage {
		if (isNumber(parameter) && message.textContent.length > parameter) {
			return {...message, senderNickname: message.senderNickname, textContent: message.textContent.substring(0, parameter)};
		}
		return message;
	}
}