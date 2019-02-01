import {Message, RoomCreatedMessage} from 'fluxxchat-protokolla';
import {Connection} from './connection';
import {Room} from './room';
import {RULES} from './rules/active-rules';

export class FluxxChatServer {
	private connections: Connection[] = [];
	private rooms: {[id: string]: Room} = {};

	public handleMessage(conn: Connection, message: Message) {
		switch (message.type) {
			case 'JOIN_ROOM':
				return this.joinRoom(conn, message.roomId, message.nickname);
			case 'CREATE_ROOM':
				return this.createRoom(conn);
			case 'LEAVE_ROOM':
				return this.removeConnection(conn);
			default:
				if (!conn.room) {
					throw new Error('Must be connected to a room');
				}
				break;
		}

		if (message.type === 'NEW_RULE') {
			this.enactRule(conn, message.card.ruleName);
		}

		if (message.type === 'TEXT') {
			message.senderNickname = conn.nickname;
		}

		for (const rule of conn.room.enabledRules) {
			const newMessage = rule.applyMessage(this, message, conn);
			if (!newMessage) {
				return; // message removed
			} else {
				message = newMessage;
			}
		}

		for (const connection of conn.room.connections) {
			connection.sendMessage(message);
		}

		// remove closed connections
		this.connections = this.connections.filter(c => !c.closed);
	}

	public removeConnection(conn: Connection) {
		const index = this.connections.findIndex(c => c.id === conn.id);
		this.connections.splice(index, 1);
		if (conn.room) {
			conn.room.removeConnection(conn);
			conn.room.sendStateMessages();
		}
	}

	public addConnection(conn: Connection) {
		this.connections.push(conn);
		conn.onMessage((_, message) => this.handleMessage(conn, message));
		conn.onClose(() => this.removeConnection(conn));
	}

	private enactRule(conn: Connection, ruleName: string) {
		if (!conn.room) {
			throw new Error('Must be connected to a room');
		}

		const rule = RULES[ruleName];
		if (!rule) {
			throw new Error(`No such rule: ${ruleName}`);
		}

		conn.room.addRule(rule);
	}

	private createRoom(conn: Connection) {
		const room = new Room();
		this.rooms[room.id] = room;
		conn.sendMessage({type: 'ROOM_CREATED', roomId: room.id} as RoomCreatedMessage);
	}

	private joinRoom(conn: Connection, roomId: string, requestedNickname: string) {
		const room = this.rooms[roomId];

		if (room) {
			if (room.connections.find(c => c.nickname === requestedNickname)) {
				// Someone else already has the requested nickname in this room
				throw new Error(`Nickname taken: ${requestedNickname}`);
			}

			if (conn.room) {
				conn.room.removeConnection(conn);
			}

			conn.nickname = requestedNickname;
			room.addConnection(conn);
			room.sendStateMessages();
			Object.keys(RULES).forEach(key => {
				conn.sendMessage({type: 'CARD', card: RULES[key].toJSON()});
			});
		} else {
			throw new Error(`Room does not exist: ${roomId}`);
		}
	}
}
