import {Model} from 'objection';

export default class RoomState extends Model {
	public static tableName = 'room_state';

	public static jsonSchema = {
		type: 'object',
		required: ['id', 'roomId', 'turnUserId', 'createdAt'],
		properties: {
			id: {type: 'string'},
			roomId: {type: 'string'},
			turnUserId: {type: 'string'},
			createdAt: {type: 'string', format: 'date-time'}
		}
	};

	public id!: string;
	public roomId!: string;
	public turnUserId!: string;
	public createdAt!: string;
}
