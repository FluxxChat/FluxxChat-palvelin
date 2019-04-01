import EventModel from './lib/event-model';

class PlayedCard extends EventModel<{
	roomStateId: string;
	ruleName: string;
	userId: string;
}> {}

export default new PlayedCard();
