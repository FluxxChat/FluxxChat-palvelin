import * as WebSocket from 'ws';
import {Message} from 'fluxxchat-protokolla';

type MessageHandler = (msg: Message) => void;

export class Connection {
	public closed = false;
	private socket: WebSocket;
	private messageHandlers: MessageHandler[] = [];

	constructor(socket: WebSocket) {
		this.socket = socket;

		socket.on('message', data => {
			const message = Message.fromJSON(data.toString());
			for (const handler of this.messageHandlers) {
				handler(message);
			}
		});

		socket.on('close', data => {
			this.closed = true;
		});
	}

	public sendMessage(message: Message): void {
		this.socket.send(JSON.stringify(message));
	}

	public onMessage(handler: MessageHandler): void {
		this.messageHandlers.push(handler);
	}
}
