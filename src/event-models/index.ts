import EventModel from './lib/event-model';

export {default as ActiveRuleEvent} from './active-rule';
export {default as ChatMessageEvent} from './chat-message';
export {default as PlayedCardEvent} from './played-card';
export {default as RoomStateUserEvent} from './room-state-user';
export {default as RoomStateEvent} from './room-state';
export {default as RoomEvent} from './room';
export {default as RuleEvent} from './rule';
export {default as UserEvent} from './user';

export const flushEvents = () => {
	EventModel.flush();
};

export const setFilePath = (path: string) => {
	EventModel.setFilePath(path);
};
