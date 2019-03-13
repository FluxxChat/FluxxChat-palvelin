import EventModel from './lib/event-model';

class Rule extends EventModel<{
	name: string;
}> {
	public readonly name = 'Rule';
}

export default new Rule();
