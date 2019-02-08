import {Rule, RuleCategory, RuleBase} from './rule';
import {FluxxChatServer} from '../server';
import {Message, RuleParameterTypes, TextMessage} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import {firstnames, lastnames} from './pseudonyme-names';

interface PseudonymeMapping {
	[id: string]: string;
}

export class PseudonymeRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set([RuleCategory.ANONYMITY] as RuleCategory[]);
	public title = global._('Pseudonymes');
	public description = global._('Give all players pseudonymes.');
	public ruleName = 'pseudonymes';
	public parameterTypes = {} as RuleParameterTypes;
	public takenNames: PseudonymeMapping = {};

	public applyMessage(_server: FluxxChatServer, message: Message, parameter: any, sender: Connection): Message {
		for (const id in this.takenNames) {
			if (id === sender.id) {
				return {...message, senderNickname: this.takenNames[id]} as TextMessage;
			}
		}
		const firstname = firstnames[Math.floor(Math.random() * Math.floor(firstnames.length))];
		const lastname = lastnames[Math.floor(Math.random() * Math.floor(lastnames.length))];
		this.takenNames[sender.id] = firstname + ' ' + lastname;
		return {...message, senderNickname: this.takenNames[sender.id]} as TextMessage;
	}

	public ruleEnabled() {
		this.takenNames = {};
	}
}
