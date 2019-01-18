import express from 'express';
import * as WebSocket from 'ws';
import Localize = require('localize');

const localize = new Localize('./i18n/');
localize.setLocale('fi');
const _: (str: string, ...subs: any[]) => string = localize.translate;

const WSS_PORT = parseInt(process.env.WSS_PORT || '3030', 10);
const wss = new WebSocket.Server({ port: WSS_PORT });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message); // tslint:disable-line:no-console
	});

	console.log(_('New connection')); // tslint:disable-line:no-console
});

const app = express();

// Fallback to index.html
app.get('/', (_req, res) => {
	return res.json({ message: 'Hello World!' });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
	console.log(_('Server listening on port $[1]', PORT)); // tslint:disable-line:no-console
});
