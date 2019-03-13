/* FluxxChat-palvelin
 * Copyright (C) 2019 Helsingin yliopisto
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {DisablingRule, Rule} from './rule';
import {AnonymityRule} from './anonymity-rule';
import {MessageMinLengthRule, MessageMaxLengthRule} from './message-length-rule';
import {MuteRule} from './mute-rule';
import {MarkdownRule} from './formatting-rule';
import {PseudonymeRule} from './pseudonyme-rule';
import {PosMaxLimitRule, PosMinLimitRule} from './pos-limit-rule';
import {ChatTurnsRule} from './chat-turns-rule';
import {HaikuRule} from './haiku-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_MIN_LENGTH = new MessageMinLengthRule();
const MESSAGE_MAX_LENGTH = new MessageMaxLengthRule();
const MUTE = new MuteRule();
const CHAT_TURNS = new ChatTurnsRule();
const MARKDOWN = new MarkdownRule();
const PSEUDONYMES = new PseudonymeRule();
const POS_MAX_LIMIT = new PosMaxLimitRule();
const POS_MIN_LIMIT = new PosMinLimitRule();
const HAIKU = new HaikuRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	message_min_length: MESSAGE_MIN_LENGTH,
	message_max_length: MESSAGE_MAX_LENGTH,
	no_message_length: new DisablingRule([MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH], 'no_message_length', global._('Disable message length')),
	pos_max_limit: POS_MAX_LIMIT,
	pos_min_limit: POS_MIN_LIMIT,
	no_pos_limit: new DisablingRule([POS_MAX_LIMIT, POS_MIN_LIMIT], 'no_pos_limit', global._('Disable POS limit')),
	haiku: HAIKU,
	no_metre: new DisablingRule([HAIKU], 'no_metre', global._('No Metre')),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all', global._('Unmute')),
	chat_turns: CHAT_TURNS,
	no_chat_turns: new DisablingRule([CHAT_TURNS], 'no_chat_turns', global._('Disable Chat Turns')),
	markdown_formatting: MARKDOWN,
	pseudonymes: PSEUDONYMES,
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting', global._('Disable MarkDown formatting')),
	return_names: new DisablingRule([ANONYMITY, PSEUDONYMES], 'return_names', global._('Return original names')),
	disable_all: new DisablingRule(_r => true, 'disable_all', global._('Disable all'))
};
