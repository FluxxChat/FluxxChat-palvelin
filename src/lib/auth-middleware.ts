export function basicAuth(users: Map<string, string>) {
	return (req, res, next) => {
		const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
		const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

		const validLogin = users.has(login) && users.get(login) === password;

		if (!validLogin) {
			res.set('WWW-Authenticate', 'Basic realm="401"');
			res.status(401).send('Authentication required');
			return;
		}
		next();
	};
}
