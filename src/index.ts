import http from 'http';
import express from 'express';
import * as WebSocket from 'ws';
import Localize = require('localize');
import {FluxxChatServer} from './server';
import {Connection} from './connection';

const localize = new Localize('./i18n/');
localize.setLocale('fi');
const _: (str: string, ...subs: any[]) => string = localize.translate;

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
	console.log(_('Server listening on port $[1]', PORT)); // tslint:disable-line:no-console
});
