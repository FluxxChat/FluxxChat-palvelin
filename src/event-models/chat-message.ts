import EventModel from './lib/event-model';

class ChatMessage extends EventModel<{
	id: string;
	roomStateId: string;
	content: string;
	draft: boolean;
	userId: string;
	timestamp: string;
}> {
	public readonly name = 'User';
}

export default new ChatMessage();
