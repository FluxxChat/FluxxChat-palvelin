import {DisablingRule, Rule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageLengthRule} from './message-length-rule';
import {MuteRule} from './mute-rule';
import {MarkdownRule} from './formatting-rule';
import {PseudonymeRule} from './pseudonyme-rule';
import {PosMaxLimitRule, PosMinLimitRule} from './pos-limit-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_LENGTH = new MessageLengthRule();
const MUTE = new MuteRule();
const MARKDOWN = new MarkdownRule();
const PSEUDONYMES = new PseudonymeRule();
const POS_MAX_LIMIT = new PosMaxLimitRule();
const POS_MIN_LIMIT = new PosMinLimitRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	no_anonymity: new DisablingRule([ANONYMITY], 'no_anonymity'),
	message_length: MESSAGE_LENGTH,
	no_message_length: new DisablingRule([MESSAGE_LENGTH], 'no_message_length'),
	pos_max_limit: POS_MAX_LIMIT,
	pos_min_limit: POS_MIN_LIMIT,
	no_pos_limit: new DisablingRule([POS_MAX_LIMIT, POS_MIN_LIMIT], 'no_pos_limit'),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all'),
	markdown_formatting: MARKDOWN,
	pseudonymes: PSEUDONYMES,
	no_pseudonymes: new DisablingRule([PSEUDONYMES], 'no_pseudonymes'),
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting'),
	disable_all: new DisablingRule([ANONYMITY, MESSAGE_LENGTH, MUTE, MARKDOWN, PSEUDONYMES], 'disable_all')
};
