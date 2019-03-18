import EventModel from './lib/event-model';

// Many-to-many relation link table for RoomState and User
class RoomStateUser extends EventModel<{
	roomStateId: string;
	userId: string;
}> {}

export default new RoomStateUser();
