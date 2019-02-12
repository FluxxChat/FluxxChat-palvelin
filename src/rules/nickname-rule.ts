import {Rule, RuleCategory, RuleBase} from './rule';
import {Connection} from '../connection';
import {Room} from '../room';

export abstract class NicknameRule extends RuleBase implements Rule {
	public ruleCategories: Set<RuleCategory> = new Set([RuleCategory.ANONYMITY] as RuleCategory[]);

	public ruleEnabled(room: Room) {
		for (const conn of room.connections) {
			conn.visibleNickname = this.createNickname(conn);
		}
	}

	public ruleDisabled(room: Room) {
		for (const conn of room.connections) {
			conn.visibleNickname = conn.nickname;
		}
	}

	protected abstract createNickname(conn: Connection): string;
}
