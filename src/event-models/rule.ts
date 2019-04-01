import EventModel from './lib/event-model';

class Rule extends EventModel<{
	name: string;
}> {}

export default new Rule();
