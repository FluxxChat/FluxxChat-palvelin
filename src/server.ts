import {Message, NewRuleMessage} from 'fluxxchat-protokolla';
import {EnabledRule} from './rules/rule';
import {Connection} from './connection';
import {intersection} from './util';
import {RULES} from './rules/activeRules';

export class FluxxChatServer {
	private enabledRules: EnabledRule[] = [];
	private connections: Connection[] = [];

	public handleMessage(message: Message) {
		// special code for the new rule message
		if (message instanceof NewRuleMessage) {
			if (RULES[message.ruleName]) {
				const newRule = RULES[message.ruleName];
				this.enabledRules = this.enabledRules.filter(r => intersection(newRule.ruleCategories, r.rule.ruleCategories).size === 0);
				this.enabledRules.push(new EnabledRule(newRule, null));
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
			try {
				connection.sendMessage(message);
			} catch (err) {
				console.error(`Could not send message to client: ${err.message}`); // tslint:disable-line:no-console
			}
		}

		// remove closed connections
		this.connections = this.connections.filter(c => !c.closed);
	}

	public sendMessage(nickname: string, message: Message) {
		// TODO
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);
	}

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.onMessage(message => this.handleMessage(message));
		conn.onClose(() => this.removeConnection(conn));
	}
}
