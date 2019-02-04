import {DisablingRule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageLengthRule} from './message-length-rule';
import {MuteRule} from './mute-rule';
import {MarkdownRule} from './formatting-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_LENGTH = new MessageLengthRule();
const MUTE = new MuteRule();
const MARKDOWN = new MarkdownRule();

export const RULES = {
	anonymity: ANONYMITY,
	no_anonymity: new DisablingRule([ANONYMITY], 'no_anonymity'),
	message_length: MESSAGE_LENGTH,
	no_message_length: new DisablingRule([MESSAGE_LENGTH], 'no_message_length'),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all'),
	markdown_formatting: MARKDOWN,
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting'),
	disable_all: new DisablingRule([ANONYMITY, MESSAGE_LENGTH, MUTE], 'disable_all')
};
