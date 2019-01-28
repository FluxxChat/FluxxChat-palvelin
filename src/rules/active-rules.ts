import {Rule, DisablingRule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageLengthRule} from './message-length-rule';
import {MuteRule} from './mute-rule';

export const RULES: { [ruleName: string]: Rule } = {
	anonymity: new AnonymityRule(),
	no_anonymity: new DisablingRule('ANONYMITY'),

	message_length: new MessageLengthRule(),
	no_message_length: new DisablingRule('MESSAGE-LENGTH'),

	mute: new MuteRule(),
	unmute_all: new DisablingRule('MUTE'),

	disable_all: new DisablingRule('ANONYMITY')
};
