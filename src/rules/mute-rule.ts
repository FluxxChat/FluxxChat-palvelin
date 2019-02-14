import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MuteRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set([RuleCategory.MUTE] as RuleCategory[]);
	public title = global._('Mute Player');
	public description = global._('Mutes a specific player.');
	public ruleName = 'mute';
	public parameterTypes = {target: 'player'} as RuleParameterTypes;

	public isValidMessage(_server: FluxxChatServer, _message: Message, parameter: any, sender: Connection) {
		return sender.id !== parameter.target;
	}
}
