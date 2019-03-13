import EventModel from './lib/event-model';

class User extends EventModel<{
	id: string;
	name: string;
}> {
	public readonly name = 'User';
}

export default new User();
