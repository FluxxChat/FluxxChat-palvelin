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

import {Rule, RuleBase} from './rule';
import {Connection} from '../connection';
import {Room} from '../room';
import {RuleParameters, TextMessage, RoomStateMessage} from 'fluxxchat-protokolla';

class RoomStatistics {
	public userStatistics: {[userId: string]: UserStatistics} = {};

	public addStatistics(_message: TextMessage, conn: Connection): void {
		this.userStatistics[conn.id] = this.userStatistics[conn.id] || new UserStatistics(conn);
		this.userStatistics[conn.id].messageCount += 1;
	}

	public getStatisticsString(): string {
		return Object.values(this.userStatistics).map(s => s.user.nickname + ': ' + s.messageCount).join(', ');
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

export class StatisticsRule extends RuleBase implements Rule {
	public title = 'rule.statistics.title';
	public description = 'rule.statistics.description';
	public ruleName = 'statistics';

	private statisticsStore: {[roomId: string]: RoomStatistics | undefined} = {};

	public ruleEnabled(room: Room) {
		this.statisticsStore[room.id] = new RoomStatistics();
	}

	public ruleDisabled(room: Room) {
		this.statisticsStore[room.id] = undefined;
	}

	public applyTextMessage(_parameters: RuleParameters, message: TextMessage, conn: Connection): TextMessage {
		this.statisticsStore[conn.room!.id]!.addStatistics(message, conn);
		conn.room!.sendStateMessages();
		return message;
	}

	public applyRoomStateMessage(_parameters: RuleParameters, message: RoomStateMessage, conn: Connection): RoomStateMessage {
		return {
			...message,
			enabledRules: message.enabledRules.map(r => ({
				...r,
				description: 'rule.statistics.statistics',
				values: {statistics: this.statisticsStore[conn.room!.id]!.getStatisticsString()}
			}))
		};
	}
}
