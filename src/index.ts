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
import * as WebSocket from 'ws';
import {basicAuth} from './lib/auth-middleware';
import * as events from './event-models';

import {FluxxChatServer} from './server';
import {Connection} from './connection';

events.setFilePath(path.resolve(__dirname, '../events.log'));
const server = new FluxxChatServer();

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({server: httpServer});

wss.on('connection', function connection(ws: WebSocket) {
	server.addConnection(new Connection(ws));
});

// User-pass map
const users = new Map();

// Add a user for local development
if (!process.env.NODE_ENV) {
	users.set('admin', 'admin');
}

// Populate user-pass map from environment
const logins = (process.env.LOGINS || '').split(';').map(l => l.split(':'));
for (const [user, pass] of logins) {
	users.set(user, pass);
}

// Event logs endpoint with http basic auth
app.get('/events', basicAuth(users), (_req, res) => {
	return res.sendFile(path.resolve(__dirname, '../events.log'));
});

// Fallback to index.html
app.get('/', (_req, res) => {
	return res.json({message: 'Hello World!'});
});

const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, () => {
	console.log('Server listening on port ' + PORT); // tslint:disable-line:no-console
});
