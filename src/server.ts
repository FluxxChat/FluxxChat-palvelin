import { Message, NewRuleMessage } from 'fluxxchat-protokolla';
import { Rule, RULES } from './rules/rule';
import { Connection } from './connection';
import { intersection } from './util';

export class FluxxChatServer {
	private enabledRules: Rule[] = [];
	private connections: Connection[] = [];

	public handleMessage(message: Message): void {
		// special code for the new rule message
		if (message instanceof NewRuleMessage) {
			if (RULES[message.ruleName]) {
				const newRule = RULES[message.ruleName];
				this.enabledRules = this.enabledRules.filter(r => intersection(newRule.ruleCategories, r.ruleCategories).size === 0);
				this.enabledRules.push(newRule);
			} else {
				console.log('Unknown rule: ' + message.ruleName); // tslint:disable-line:no-console
				return;
			}
		}

		// main routine
		for (const rule of this.enabledRules) {
			message = rule.applyMessage(this, message);
		}
		for (const connection of this.connections) {
			if (!connection.closed) {
				connection.sendMessage(message);
			}
		}

		// remove closed connections
		this.connections = this.connections.filter(c => !c.closed);
	}

	public sendMessage(nickname: string, message: Message) {
		// TODO
	}

	public addConnection(conn: Connection): void {
		this.connections.push(conn);
		conn.onMessage(message => this.handleMessage(message));
	}
}
