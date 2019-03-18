import EventModel from './lib/event-model';

class Room extends EventModel<{
	id: string;
}> {}

export default new Room();
