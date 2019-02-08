import {DisablingRule, Rule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageMaxLengthRule} from './message-max-length-rule';
import {MessageMinLengthRule} from './message-min-length-rule';
import {MuteRule} from './mute-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_MAX_LENGTH = new MessageMaxLengthRule();
const MESSAGE_MIN_LENGTH = new MessageMinLengthRule();
const MUTE = new MuteRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	no_anonymity: new DisablingRule([ANONYMITY], 'no_anonymity'),
	max_message_length: MESSAGE_MAX_LENGTH,
	min_message_length: MESSAGE_MIN_LENGTH,
	no_message_max_length: new DisablingRule([MESSAGE_MAX_LENGTH], 'no_message_length'),
	no_message_min_length: new DisablingRule([MESSAGE_MIN_LENGTH], 'no_message_length'),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all'),
	disable_all: new DisablingRule([ANONYMITY, MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH, MUTE], 'disable_all')
};
