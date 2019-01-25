import uuid from 'uuid';
import {Connection} from './connection';
import {RoomStateMessage, User} from 'fluxxchat-protokolla';

export class Room {
	public id = uuid.v4();
	public connections: Connection[] = [];

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.room = this;
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);
	}

	public sendStateMessages() {
		const state = this.getStateMessage();
		for (const conn of this.connections) {
			conn.sendMessage(state);
		}
	}

	public getStateMessage(): RoomStateMessage {
		const users: User[] = this.connections.map(conn => ({id: conn.id, nickname: conn.nickname}));
		return {
			type: 'ROOM_STATE',
			users
		};
	}
}
