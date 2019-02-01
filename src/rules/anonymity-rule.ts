import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message, TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';

export class AnonymityRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.ANONYMITY]);
	public title = 'Anonymity';
	public description = 'Hides the identity of players.';
	public ruleName = 'anonymity';
	public parameterTypes = {none: ''} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: Message, _parameter: any): Message {
		if (message.type === 'TEXT') {
			return {...message, senderNickname: '***'} as TextMessage;
		}
		return message;
	}
}
