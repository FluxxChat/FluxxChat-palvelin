import * as WebSocket from 'ws';
import uuid from 'uuid';
import {Message} from 'fluxxchat-protokolla';
import {Room} from './room';

type MessageHandler = (conn: Connection, msg: Message) => void;
type CloseHandler = () => void;

export class Connection {
	public id = uuid.v4();
	public closed = false;
	public room?: Room;
	public nickname: string = this.id;

	private socket: WebSocket;
	private messageHandlers: MessageHandler[] = [];
	private closeHandlers: CloseHandler[] = [];

	constructor(socket: WebSocket) {
		this.socket = socket;

		socket.on('message', data => {
			const message: Message = JSON.parse(data.toString());
			for (const handler of this.messageHandlers) {
				try {
					handler(this, message);
				} catch (err) {
					console.error(err); // tslint:disable-line:no-console
				}
			}
		});

		socket.on('close', () => {
			this.closed = true;
			for (const handler of this.closeHandlers) {
				try {
					handler();
				} catch (err) {
					console.error(err); // tslint:disable-line:no-console
				}
			}
		});
	}

	public sendMessage(message: Message): void {
		try {
			this.socket.send(JSON.stringify(message));
		} catch (err) {
			console.error(err); // tslint:disable-line:no-console
		}
	}

	public onMessage(handler: MessageHandler): void {
		this.messageHandlers.push(handler);
	}

	public onClose(handler: CloseHandler): void {
		this.closeHandlers.push(handler);
	}
}
