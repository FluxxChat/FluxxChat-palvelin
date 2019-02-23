/* FluxxChat-palvelin
 * Copyright (C) 2019 Helsingin yliopisto
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as WebSocket from 'ws';
import uuid from 'uuid';
import {Message, Card} from 'fluxxchat-protokolla';
import {Room} from './room';
import {RULES} from './rules/active-rules';
import ErrorMessage from './lib/error';

type MessageHandler = (conn: Connection, msg: Message) => void;
type CloseHandler = () => void;

export class Connection {
	public id = uuid.v4();
	public closed = false;
	public room?: Room;
	public nickname: string = this.id;
	public visibleNickname: string = this.nickname;
	public profileImg: string = 'default';
	public visibleProfileImg: string = this.profileImg;
	public hand: string[] = [];

	private socket: WebSocket;
	private messageHandlers: MessageHandler[] = [];
	private closeHandlers: CloseHandler[] = [];
	private timer: any;

	constructor(socket: WebSocket) {
		this.socket = socket;

		socket.on('message', data => {
			const message: Message = JSON.parse(data.toString());
			for (const handler of this.messageHandlers) {
				try {
					handler(this, message);
				} catch (err) {
					this.handleError(err);
				}
			}
		});

		socket.on('close', () => {
			this.closed = true;
			for (const handler of this.closeHandlers) {
				try {
					handler();
				} catch (err) {
					this.handleError(err);
				}
			}
			clearInterval(this.timer);
		});

		this.timer = setInterval(() => {
			this.sendMessage({type: 'KEEP_ALIVE'});
		}, 5000);
	}

	public handleError(error: ErrorMessage) {
		if (error.internal === false) {
			this.sendMessage({type: 'ERROR', message: error.message});
		}
		console.error(error.message); // tslint:disable-line:no-console
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

	public getCardsInHand(): Card[] {
		return this.hand.map(key => RULES[key].toJSON());
	}
}
