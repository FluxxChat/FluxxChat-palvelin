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

import {Connection} from '../connection';
import {firstnames, lastnames} from './pseudonyms.json';
import {NicknameRule} from './nickname-rule';

export class PseudonymRule extends NicknameRule {
	public title = 'rule.pseudonyms.title';
	public description = 'rule.pseudonyms.description';
	public ruleName = 'pseudonyms';

	protected createNickname(_conn: Connection) {
		const firstname = firstnames[Math.floor(Math.random() * Math.floor(firstnames.length))];
		const lastname = lastnames[Math.floor(Math.random() * Math.floor(lastnames.length))];
		return `${firstname} ${lastname}`;
	}
}
