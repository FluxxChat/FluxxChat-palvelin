import EventModel from './lib/event-model';

class User extends EventModel<{
	id: string;
	name: string;
	connected: boolean;
}> {}

export default new User();
