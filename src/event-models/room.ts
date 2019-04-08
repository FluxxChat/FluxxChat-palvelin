import {Model} from 'objection';

export default class Room extends Model {
	public static tableName = 'room';

	public static jsonSchema = {
		type: 'object',
		required: ['id', 'availableRules', 'createdAt'],
		properties: {
			id: {type: 'string'},
			availableRules: {type: 'string'},
			createdAt: {type: 'string', format: 'date-time'}
		}
	};

	public id!: string;
	public availableRules!: string;
	public createdAt!: string;
}
