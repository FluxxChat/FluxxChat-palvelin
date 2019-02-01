import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message, TextMessage, RuleParameterTypes, RuleParameters} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class AnonymityRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.ANONYMITY]);
	public title = global._('Anonymity');
	public description = global._('Hides the identity of players.');
	public ruleName = 'anonymity';
	public parameterTypes = {} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: RuleParameters, _sender: Connection): Message {
		if (message.type === 'TEXT') {
			return {...message, senderNickname: '***'} as TextMessage;
		}
		return message;
	}
}
