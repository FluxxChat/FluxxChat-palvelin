import path from 'path';
import Knex from 'knex';
import {Model, knexSnakeCaseMappers} from 'objection';
import EventModel from './lib/event-model';

import ActiveRule from './active-rule';
import ChatMessage from './chat-message';
import RoomState from './room-state';
import Room from './room';
import RoomStateUser from './room-state-user';

export {ActiveRule as ActiveRuleEvent};
export {ChatMessage as ChatMessageEvent};
export {RoomState as RoomStateEvent};
export {Room as RoomEvent};
export {RoomStateUser as RoomStateUserEvent};

export const flushEvents = () => {
	EventModel.flush();
};

export const setFilePath = (p: string) => {
	EventModel.setFilePath(p);
};

const MODELS = [ActiveRule, ChatMessage, RoomState, Room, RoomStateUser];

const buildTable = (table: Knex.CreateTableBuilder, model: typeof MODELS[number]) => {
	const keys = Object.keys(model.jsonSchema.properties);

	for (const colName of keys) {
		const prop: {type: string | string[]; format?: string} = model.jsonSchema.properties[colName];

		const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;

		if (type === 'string') {
			if (prop.format === 'date-time') {
				table.dateTime(colName);
			} else {
				table.string(colName);
			}
		}

		if (type === 'boolean') {
			table.boolean(colName);
		}

		if (type === 'number') {
			table.float(colName);
		}
	}

	table.unique(['id']);
	table.primary(['id']);
};

export const initDb = async () => {
	const knex = Knex({
		client: 'sqlite3',
		connection: {
			filename: path.resolve(__dirname, '../../db.sqlite')
		},
		useNullAsDefault: true,
		...knexSnakeCaseMappers()
	});

	// Connect objection model to knex instance
	Model.knex(knex);

	// Ensure database has table schemas
	const tasks = MODELS.map(async model => {
		const hasTable = await knex.schema.hasTable(model.tableName);
		if (!hasTable) {
			await knex.schema.createTable(model.tableName, table => buildTable(table, model));
		}
	});

	await Promise.all(tasks);

	return knex;
};
