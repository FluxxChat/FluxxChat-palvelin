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
import {PseudonymRule} from './pseudonym-rule';
import {PosMaxLimitRule, PosMinLimitRule} from './pos-limit-rule';
import {ChatTurnsRule} from './chat-turns-rule';
import {HaikuRule} from './haiku-rule';
import {ImageMessageRule} from './image-message-rule';
import {AudioMessageRule} from './audio-message-rule';
import {InputMinHeight} from './input-min-height';
import {ThreadsRule} from './threads-rule';
import {NoEmojisRule} from './emoji-rule';
import {StatisticsRule} from './statistics-rule';
import {NoRemovingRule} from './no-removing-rule';
import {PredictWordRule} from './predict-word-rule';

const ANONYMITY = new AnonymityRule();
const MESSAGE_MIN_LENGTH = new MessageMinLengthRule();
const MESSAGE_MAX_LENGTH = new MessageMaxLengthRule();
const MUTE = new MuteRule();
const CHAT_TURNS = new ChatTurnsRule();
const MARKDOWN = new MarkdownRule();
const PSEUDONYMS = new PseudonymRule();
const POS_MAX_LIMIT = new PosMaxLimitRule();
const POS_MIN_LIMIT = new PosMinLimitRule();
const HAIKU = new HaikuRule();
const IMAGE_MESSAGES = new ImageMessageRule();
const AUDIO_MESSAGES = new AudioMessageRule();
const INPUT_MIN_HEIGHT = new InputMinHeight();
const THREADS = new ThreadsRule();
const NO_EMOJIS = new NoEmojisRule();
const STATISTICS = new StatisticsRule();
const NO_REMOVING = new NoRemovingRule();
const PREDICT_WORD = new PredictWordRule();

export const RULES: {[key: string]: Rule} = {
	anonymity: ANONYMITY,
	message_min_length: MESSAGE_MIN_LENGTH,
	message_max_length: MESSAGE_MAX_LENGTH,
	no_message_length: new DisablingRule([MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH], 'no_message_length', 'rule.noMessageLength.title'),
	pos_max_limit: POS_MAX_LIMIT,
	pos_min_limit: POS_MIN_LIMIT,
	no_pos_limit: new DisablingRule([POS_MAX_LIMIT, POS_MIN_LIMIT], 'no_pos_limit', 'rule.noPosLimit.title'),
	haiku: HAIKU,
	no_metre: new DisablingRule([HAIKU], 'no_metre', 'rule.noMetre.title'),
	mute: MUTE,
	unmute_all: new DisablingRule([MUTE], 'unmute_all', 'rule.unmute.title'),
	chat_turns: CHAT_TURNS,
	no_chat_turns: new DisablingRule([CHAT_TURNS], 'no_chat_turns', 'rule.noChatTurns.title'),
	markdown_formatting: MARKDOWN,
	pseudonyms: PSEUDONYMS,
	image_messages: IMAGE_MESSAGES,
	no_image_messages: new DisablingRule([IMAGE_MESSAGES], 'no_image_messages', 'rule.disableImageMessages.title'),
	audio_messages: AUDIO_MESSAGES,
	no_audio_messages: new DisablingRule([AUDIO_MESSAGES], 'no_audio_messages', 'rule.disableAudioMessages.title'),
	input_min_height: INPUT_MIN_HEIGHT,
	no_input_min_height: new DisablingRule([INPUT_MIN_HEIGHT], 'no_input_min_height', 'rule.disableInputMinHeight.title'),
	threads: THREADS,
	no_threads: new DisablingRule([THREADS], 'no_threads', 'rule.disableThreads.title'),
	disable_formatting: new DisablingRule([MARKDOWN], 'disable_formatting', 'rule.disableFormatting.title'),
	return_names: new DisablingRule([ANONYMITY, PSEUDONYMS], 'return_names', 'rule.returnNames.title'),
	no_emojis: NO_EMOJIS,
	allow_emojis: new DisablingRule([NO_EMOJIS], 'allow_emojis', 'rule.allowEmojis.title'),
	statistics: STATISTICS,
	no_statistics: new DisablingRule([STATISTICS], 'no_statistics', 'rule.noStatistics.title'),
	no_removing: NO_REMOVING,
	allow_removing: new DisablingRule([NO_REMOVING], 'allow_removing', 'rule.allowRemoving.title'),
	predict_word: PREDICT_WORD,
	disable_predict_word: new DisablingRule([PREDICT_WORD], 'disable_predict_word', 'rule.disablePredictWord.title'),
	disable_all: new DisablingRule(_r => true, 'disable_all', 'rule.disableAll.title', 'rule.disableAll.description')
};
