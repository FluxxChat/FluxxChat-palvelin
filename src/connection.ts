import * as WebSocket from 'ws';
import uuid from 'uuid';
import {Message} from 'fluxxchat-protokolla';

type MessageHandler = (msg: Message) => void;
type CloseHandler = () => void;

export class Connection {
	public id = uuid.v4();
	public closed = false;
	private socket: WebSocket;
	private messageHandlers: MessageHandler[] = [];
	private closeHandlers: CloseHandler[] = [];

	constructor(socket: WebSocket) {
		this.socket = socket;

		socket.on('message', data => {
			const message = Message.fromJSON(data.toString());
			for (const handler of this.messageHandlers) {
				handler(message);
			}
		});

		socket.on('close', () => {
			this.closed = true;
			for (const handler of this.closeHandlers) {
				handler();
			}
		});
	}

	public sendMessage(message: Message): void {
		this.socket.send(JSON.stringify(message));
	}

	public onMessage(handler: MessageHandler): void {
		this.messageHandlers.push(handler);
	}

	public onClose(handler: CloseHandler): void {
		this.closeHandlers.push(handler);
	}
}
