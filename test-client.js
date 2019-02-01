const WebSocket = require("ws");
const readline = require('readline');
const ws = new WebSocket("ws://localhost:3000/");
ws.on('message', data => {
	const message = JSON.parse(data);
	console.log("<%s> %s", message.senderNickname, data);
});

var nick = "test";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ''
});

rl.on('line', (line) => {
	line = line.trim();
	var msg;
	if (line === "/create") {
		msg = {
			type: 'CREATE_ROOM',
		};
	} else if (line.startsWith("/join ")) {
		msg = {
			type: 'JOIN_ROOM',
			nickname: nick,
			roomId: line.substr("/join ".length)
		};
	} else if (line.startsWith("/play ")) {
		msg = {
			type: 'NEW_RULE',
			card: JSON.parse(line.substr("/play ".length))
		};
	} else {
		msg = {
			senderNickname: nick,
			type: 'TEXT',
			textContent: line
		};
	}
	ws.send(JSON.stringify(msg));
	rl.prompt();
}).on('close', () => {
	process.exit(0);
});
