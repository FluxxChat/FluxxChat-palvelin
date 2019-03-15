import EventModel from './lib/event-model';

class RoomState extends EventModel<{
	id: string;
	roomId: string;
	turnUserId: string;
}> {}

export default new RoomState();
