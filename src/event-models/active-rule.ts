import EventModel from './lib/event-model';

class ActiveRule extends EventModel<{
	id: string;
	roomStateId: string;
	ruleName: string;
	userId: string;
	parameters: string;
	timestamp: string;
}> {
	public readonly name = 'ActiveRule';
}

export default new ActiveRule();
