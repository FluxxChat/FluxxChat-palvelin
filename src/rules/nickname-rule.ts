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

import {Rule, RuleCategory, RuleBase} from './rule';
import {Connection} from '../connection';
import {Room} from '../room';

export abstract class NicknameRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set([RuleCategory.ANONYMITY] as RuleCategory[]);

	public ruleEnabled(room: Room) {
		for (const conn of room.connections) {
			conn.visibleNickname = this.createNickname(conn);
			conn.visibleProfileImg = 'default';
		}
	}

	public ruleDisabled(room: Room) {
		for (const conn of room.connections) {
			conn.visibleNickname = conn.nickname;
			conn.visibleProfileImg = conn.profileImg;
		}
	}

	protected abstract createNickname(conn: Connection): string;
}
