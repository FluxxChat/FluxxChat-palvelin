import {Connection} from '../connection';
import {firstnames, lastnames} from './pseudonyme-names';
import {NicknameRule} from './nickname-rule';

export class PseudonymeRule extends NicknameRule {
	public title = global._('Pseudonymes');
	public description = global._('Give all players pseudonymes.');
	public ruleName = 'pseudonymes';

	protected createNickname(_conn: Connection) {
		const firstname = firstnames[Math.floor(Math.random() * Math.floor(firstnames.length))];
		const lastname = lastnames[Math.floor(Math.random() * Math.floor(lastnames.length))];
		return `${firstname} ${lastname}`;
	}
}
