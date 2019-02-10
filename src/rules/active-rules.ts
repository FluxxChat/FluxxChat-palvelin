import {DisablingRule, Rule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageMaxLengthRule} from './message-max-length-rule';
import {MessageMinLengthRule} from './message-min-length-rule';
import {MuteRule} from './mute-rule';
import {MarkdownRule} from './formatting-rule';
import {PseudonymeRule} from './pseudonyme-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_MAX_LENGTH = new MessageMaxLengthRule();
const MESSAGE_MIN_LENGTH = new MessageMinLengthRule();
const MUTE = new MuteRule();
const MARKDOWN = new MarkdownRule();
const PSEUDONYMES = new PseudonymeRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	no_anonymity: new DisablingRule([ANONYMITY], 'no_anonymity'),
	message_max_length: MESSAGE_MAX_LENGTH,
	message_min_length: MESSAGE_MIN_LENGTH,
	no_message_max_length: new DisablingRule([MESSAGE_MAX_LENGTH], 'no_message_max_length'),
	no_message_min_length: new DisablingRule([MESSAGE_MIN_LENGTH], 'no_message_min_length'),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all'),
	markdown_formatting: MARKDOWN,
	pseudonymes: PSEUDONYMES,
	no_pseudonymes: new DisablingRule([PSEUDONYMES], 'no_pseudonymes'),
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting'),
	disable_all: new DisablingRule([ANONYMITY, MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH, MUTE, MARKDOWN, PSEUDONYMES], 'disable_all'),
};
