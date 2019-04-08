import {Model} from 'objection';

export default class RoomStateUser extends Model {
	public static tableName = 'room_state_user';

	public static jsonSchema = {
		type: 'object',
		required: ['id', 'userId', 'nickname', 'roomStateId', 'hand', 'createdAt'],
		properties: {
			id: {type: 'string'},
			userId: {type: 'string'},
			nickname: {type: 'string'},
			roomStateId: {type: 'string'},
			hand: {type: 'string'},
			createdAt: {type: 'string', format: 'date-time'}
		}
	};

	public id!: string;
	public userId!: string;
	public nickname!: string;
	public roomStateId!: string;
	public hand!: string;
	public createdAt!: string;
}
