import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {isNumber} from 'util';
import {Connection} from '../connection';

export class MessageLengthRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.MESSAGELENGTH]);
	public title = global._('Message Length Limit');
	public description = global._('Restricts message length.');
	public ruleName = 'message_length';
	public parameterTypes = {length: 'number'} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, parameter: any, _sender: Connection): TextMessage {
		if (isNumber(parameter) && message.textContent.length > parameter) {
			return {...message, textContent: message.textContent.substring(0, parameter)};
		}
		return message;
	}
}
