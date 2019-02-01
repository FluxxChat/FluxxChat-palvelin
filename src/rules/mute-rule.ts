import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MuteRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set(['MUTE'] as RuleCategory[]);

	public applyMessage(_server: FluxxChatServer, message: Message, parameter: any, sender: Connection): Message | null {
		if (sender.id === parameter.target) {
			return null;
		}
		return message;
	}
}
