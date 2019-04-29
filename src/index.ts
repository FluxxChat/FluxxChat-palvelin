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

import path from 'path';
import http from 'http';
import express from 'express';
import uuid from 'uuid';
import * as WebSocket from 'ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import {basicAuth, tokenAuth} from './lib/auth-middleware';
import * as events from './event-models';

import {FluxxChatServer} from './server';
import {Connection} from './connection';

const TOKEN_EXPIRE_MINUTES = 120;

events.setFilePath(path.resolve(__dirname, '../events.log'));
const server = new FluxxChatServer();

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({server: httpServer});

wss.on('connection', function connection(ws: WebSocket) {
	server.addConnection(new Connection(ws));
});

// User:pass map
const users = new Map();

// access-token:token-data map
const tokens = new Map();

// Add a user for local development
if (!process.env.NODE_ENV) {
	users.set('admin', 'admin');
}

if (process.env.LOGINS) {
	// Populate user-pass map from environment
	const logins = process.env.LOGINS.split(';').map(l => l.split(':'));
	for (const [user, pass] of logins) {
		users.set(user, pass);
	}
}

(async () => {
	const db = await events.initDb();

	app.use('/admin', cors());

	app.post('/admin/token', basicAuth(users), (_req, res) => {
		const expireMillis = 1000 * 60 * TOKEN_EXPIRE_MINUTES;

		const tokenData = {
			accessToken: uuid.v4(),
			exp: Date.now() + expireMillis
		};

		tokens.set(tokenData.accessToken, tokenData);

		setTimeout(() => {
			tokens.delete(tokenData.accessToken);
		}, expireMillis);

		res.json({data: tokenData});
	});

	app.post('/admin/query', [tokenAuth(tokens), bodyParser.json()], async (req, res) => {
		const query = req.body.query.split('\n').filter(l => !l.startsWith('--')).join('\n');

		// Make sure query is a select statement
		if (!/^select/i.test(query)) {
			return res.status(400).json({error: {status: 400, message: 'Only select statements are supported'}});
		}

		try {
			const response = await db.raw(query);
			res.json({data: response});
		} catch (err) {
			res.status(500).json({error: {status: 500, message: err.message}});
		}
	});

	// Fallback to index.html
	app.get('/', (_req, res) => {
		return res.json({message: 'Hello World!'});
	});

	const PORT = parseInt(process.env.PORT || '3000', 10);
	httpServer.listen(PORT, () => {
		console.log('Server listening on port ' + PORT); // tslint:disable-line:no-console
	});
})();
