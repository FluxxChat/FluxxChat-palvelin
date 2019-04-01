import EventModel from './lib/event-model';

class ChatMessage extends EventModel<{
	id: string;
	roomStateId: string;
	content: string;
	draft: boolean;
	userId: string;
	userVisibleName: string;
}> {}

export default new ChatMessage();
