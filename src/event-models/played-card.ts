import EventModel from './lib/event-model';

class PlayedCard extends EventModel<{
	roomStateId: string;
	ruleName: string;
	userId: string;
	timestamp: string;
}> {
	public readonly name = 'PlayedCard';
}

export default new PlayedCard();
