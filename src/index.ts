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

import http from 'http';
import express from 'express';
import * as WebSocket from 'ws';
import Localize = require('localize');

const localize = new Localize('./i18n/');
localize.setLocale('fi');
global._ = localize.translate;

import {FluxxChatServer} from './server';
import {Connection} from './connection';

const server = new FluxxChatServer();

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({server: httpServer});

wss.on('connection', function connection(ws: WebSocket) {
	server.addConnection(new Connection(ws));
});

// Fallback to index.html
app.get('/', (_req, res) => {
	return res.json({message: 'Hello World!'});
});

const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, () => {
	console.log(global._('Server listening on port $[1]', PORT)); // tslint:disable-line:no-console
});
