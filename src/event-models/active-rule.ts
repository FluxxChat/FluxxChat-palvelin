import {Model} from 'objection';

export default class ActiveRule extends Model {
	public static tableName = 'active_rule';

	public static jsonSchema = {
		type: 'object',
		required: ['id', 'ruleName', 'roomStateId', 'parameters', 'createdAt'],
		properties: {
			id: {type: 'string'},
			ruleName: {type: 'string'},
			roomStateId: {type: 'string'},
			userId: {type: ['string', 'null']},
			parameters: {type: 'string'},
			createdAt: {type: 'string', format: 'date-time'}
		}
	};

	public id!: string;
	public ruleName!: string;
	public roomStateId!: string;
	public userId: string | null;
	public parameters!: string;
	public createdAt!: string;
}
