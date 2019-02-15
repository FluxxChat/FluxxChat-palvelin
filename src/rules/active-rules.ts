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
import {MessageLengthRule} from './message-length-rule';
import {MuteRule} from './mute-rule';
import {MarkdownRule} from './formatting-rule';
import {PseudonymeRule} from './pseudonyme-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_LENGTH = new MessageLengthRule();
const MUTE = new MuteRule();
const MARKDOWN = new MarkdownRule();
const PSEUDONYMES = new PseudonymeRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	message_length: MESSAGE_LENGTH,
	no_message_length: new DisablingRule([MESSAGE_LENGTH], 'no_message_length', global._('Disable message length')),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all', global._('Unmute')),
	markdown_formatting: MARKDOWN,
	pseudonymes: PSEUDONYMES,
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting', global._('Disable MarkDown formatting')),
	return_names: new DisablingRule([ANONYMITY, PSEUDONYMES], 'return_names', global._('Return original names')),
	disable_all: new DisablingRule([ANONYMITY, MESSAGE_LENGTH, MUTE, MARKDOWN, PSEUDONYMES], 'disable_all', global._('Disable all'))
};
