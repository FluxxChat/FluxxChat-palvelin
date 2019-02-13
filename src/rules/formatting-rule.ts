import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {TextMessage, RuleParameterTypes} from 'fluxxchat-protokolla';
import {Connection} from '../connection';

export class MarkdownRule extends RuleBase implements Rule {
	public ruleCategories = new Set([RuleCategory.FORMATTING]);
	public title = global._('MarkDown Formatting');
	public description = global._('All messages are rendered as MarkDown.');
	public ruleName = 'markdown_formatting';
	public parameterTypes = {} as RuleParameterTypes;

	public applyMessage(_server: FluxxChatServer, message: TextMessage, _parameter: any, _sender: Connection) {
		message.markdown = true;
		return message;
	}
}
