import {Model} from 'objection';

export default class ChatMessage extends Model {
	public static tableName = 'chat_message';

	public static jsonSchema = {
		type: 'object',
		required: ['id', 'roomStateId', 'userId', 'userVisibleNickname', 'content', 'draft', 'valid', 'createdAt'],
		properties: {
			id: {type: 'string'},
			roomStateId: {type: 'string'},
			userId: {type: 'string'},
			userVisibleNickname: {type: 'string'},
			content: {type: 'string'},
			draft: {type: 'boolean'},
			valid: {type: 'boolean'},
			invalidReason: {type: 'string'},
			createdAt: {type: 'string', format: 'date-time'}
		}
	};

	public id!: string;
	public roomStateId!: string;
	public userId!: string;
	public userVisibleNickname!: string;
	public content!: string;
	public draft!: boolean;
	public valid!: boolean;
	public invalidReason?: string;
	public createdAt!: string;
}
