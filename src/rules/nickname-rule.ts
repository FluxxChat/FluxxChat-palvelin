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

export abstract class NicknameRule extends RuleBase implements Rule {
	private nicknameStore: { [roomId: string]: { [connId: string]: string } | undefined } = {};

	public ruleEnabled(room: Room, enabledRule: EnabledRule) {
		room.enabledRules
			.filter(r => (
				r.rule === this
				|| r.rule.ruleName === 'anonymity'
				|| r.rule.ruleName === 'pseudonyms'
			) && r !== enabledRule).forEach(room.removeRule.bind(room));
		this.nicknameStore[room.id] = {};
	}

	public ruleDisabled(room: Room) {
		this.nicknameStore[room.id] = undefined;
	}

	public applyTextMessage(_parameters: RuleParameters, message: TextMessage, conn: Connection): TextMessage {
		const nickname = this.getNickname(conn);
		return {...message, senderNickname: nickname};
	}

	public applyRoomStateMessage(_parameters: RuleParameters, message: RoomStateMessage, conn: Connection): RoomStateMessage {
		return {...message};
	}

	protected abstract createNickname(conn: Connection): string;

	private getNickname(conn: Connection): string {
		const store = this.nicknameStore[conn.room!.id]!;
		if (!store[conn.id]) {
			store[conn.id] = this.createNickname(conn);
		}
		return store[conn.id];
	}
}
