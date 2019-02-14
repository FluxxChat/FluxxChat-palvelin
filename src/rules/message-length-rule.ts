import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MessageLengthRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.MESSAGELENGTH]);
	public title = global._('Message Length Limit');
	public description = global._('Restricts message length.');
	public ruleName = 'message_length';
	public parameterTypes = {length: 'number'} as RuleParameterTypes;

	public isValidMessage(_server: FluxxChatServer, message: TextMessage, parameter: any, _sender: Connection) {
		return message.textContent.length <= parameter.length;
	}
}
