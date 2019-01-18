import { Message } from 'fluxxchat-protokolla';
import { FluxxChatServer } from '../server';

export type Rule = (server: FluxxChatServer, message: Message) => Message;