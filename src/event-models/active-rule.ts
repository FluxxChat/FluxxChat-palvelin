import EventModel from './lib/event-model';

class ActiveRule extends EventModel<{
	ruleName: string;
	roomStateId: string;
	userId: string;
	parameters: string;
}> {}

export default new ActiveRule();
