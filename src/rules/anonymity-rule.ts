import {Connection} from '../connection';
import {NicknameRule} from './nickname-rule';

export class AnonymityRule extends NicknameRule {
	public title = global._('Anonymity');
	public description = global._('Hides the identity of players.');
	public ruleName = 'anonymity';

	protected createNickname(_conn: Connection) {
		return '***';
	}
}
