import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MessageMaxLengthRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.MESSAGELENGTH]);
	public title = global._('Message maximum length limit');
	public description = global._('Restricts message maximum length.');
	public ruleName = 'message_max_length';
	public parameterTypes = {length: 'number'} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, parameter: any, _sender: Connection): TextMessage {
		if (message.textContent.length > parameter.length) {
			return {...message, textContent: message.textContent.substring(0, parameter.length)};
		}
		return message;
	}
}
