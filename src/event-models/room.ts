import EventModel from './lib/event-model';

class Room extends EventModel<{
	id: string;
	timestamp: string;
}> {
	public readonly name = 'Room';
}

export default new Room();
