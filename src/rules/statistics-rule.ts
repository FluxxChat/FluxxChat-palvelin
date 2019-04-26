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

import {Rule, RuleBase, EnabledRule} from './rule';
import {Connection} from '../connection';
import {Room} from '../room';
import {RuleParameters, TextMessage, RoomStateMessage} from 'fluxxchat-protokolla';

class RoomStatistics {
	public userStatistics: {[userId: string]: UserStatistics} = {};
	public wordStatistics: {[word: string]: WordStatistics} = {};

	public addStatistics(message: TextMessage, conn: Connection): void {
		this.userStatistics[conn.id] = this.userStatistics[conn.id] || new UserStatistics(conn);
		this.userStatistics[conn.id].messageCount += 1;

		for (let word of message.textContent.split(/\s+/)) {
			word = word.replace(/[^\w\-]/gu, '').toLowerCase();
			this.wordStatistics[word] = this.wordStatistics[word] || new WordStatistics(word);
			this.wordStatistics[word].count += 1;
		}
	}

	public getStatisticsString(): string {
		let msg = Object.values(this.userStatistics).map(s => s.user.nickname + ': ' + s.messageCount).join(', ');
		msg += '\n';
		msg += Object.values(this.wordStatistics).sort((a, b) => b.count - a.count).slice(0, 10).map((s, i) => (i + 1) + '. ' + s.word + ' (' + s.count + ')').join('\n');
		return msg;
	}
}

class UserStatistics {
	public user: Connection;
	public messageCount: number;

	constructor(user: Connection) {
		this.user = user;
		this.messageCount = 0;
	}
}

class WordStatistics {
	public word: string;
	public count: number;

	constructor(word: string) {
		this.word = word;
		this.count = 0;
	}
}

export class StatisticsRule extends RuleBase implements Rule {
	public title = 'rule.statistics.title';
	public description = 'rule.statistics.description';
	public ruleName = 'statistics';

	private statisticsStore: {[roomId: string]: RoomStatistics | undefined} = {};

	public ruleEnabled(room: Room, enabledRule: EnabledRule) {
		super.ruleEnabled(room, enabledRule);
		this.statisticsStore[room.id] = new RoomStatistics();
	}

	public ruleDisabled(room: Room) {
		this.statisticsStore[room.id] = undefined;
	}

	public applyTextMessage(_parameters: RuleParameters, message: TextMessage, conn: Connection): TextMessage {
		if (message.validateOnly) {
			return message;
		}
		this.statisticsStore[conn.room!.id]!.addStatistics(message, conn);
		conn.room!.sendStateMessages();
		return message;
	}

	public applyRoomStateMessage(_parameters: RuleParameters, message: RoomStateMessage, conn: Connection): RoomStateMessage {
		return {
			...message,
			enabledRules: message.enabledRules.map(r => (r.ruleName === this.ruleName ? {
				...r,
				description: 'rule.statistics.statistics',
				values: {statistics: this.statisticsStore[conn.room!.id]!.getStatisticsString()}
			} : r))
		};
	}
}
