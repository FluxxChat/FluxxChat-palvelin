import EventModel from './lib/event-model';

class RoomState extends EventModel<{
	id: string;
	roomId: string;
	turnUserId: string;
	timestamp: string;
}> {
	public readonly name = 'RoomState';
}

export default new RoomState();
