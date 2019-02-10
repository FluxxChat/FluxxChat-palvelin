import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import ErrorMessage from '../lib/error';

export class MessageMinLengthRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.MESSAGELENGTH]);
	public title = global._('Message minimum length limit');
	public description = global._('Restricts message minimum length.');
	public ruleName = 'message_min_length';
	public parameterTypes = {length: 'number'} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, parameter: any, _sender: Connection): TextMessage {
		if (message.textContent.length <= parameter.length) {
			throw new ErrorMessage({internal: false, message: 'Your message was too short.'});
		}
		return message;
	}
}
