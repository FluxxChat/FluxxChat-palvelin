import { Message } from 'fluxxchat-protokolla';
import { Rule } from './rules/rule';
import { Connection } from './connection';

export class FluxxChatServer {
	private enabledRules: Rule[] = [];
	private connections: Connection[] = [];
	
	public handleMessage(message: Message): void {
		for (const rule of this.enabledRules) {
			message = rule(this, message);
		}
		for (const connection of this.connections) {
			connection.sendMessage(message);
		}
	}

	public sendMessage(nickname: string, message: Message) {
		// TODO
	}

	public addConnection(conn: Connection): void {
		this.connections.push(conn);
		conn.onMessage(message => this.handleMessage(message));
	}
}
