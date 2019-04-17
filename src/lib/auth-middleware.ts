export function basicAuth(users: Map<string, string>) {
	return (req, res, next) => {
		const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
		const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

		const validLogin = users.has(login) && users.get(login) === password;

		if (!validLogin) {
			res.set('WWW-Authenticate', 'Basic realm="401"');
			return res.status(401).json({error: {status: 401, message: 'Authentication required'}});
		}

		next();
	};
}

export function tokenAuth(tokens: Map<string, {exp: number}>) {
	return (req, res, next) => {
		const token = (req.headers.authorization || '').split(' ')[1] || '';

		const tokenData = tokens.get(token);
		const tokenExpired = tokenData && tokenData.exp < Date.now();

		if (tokenExpired) {
			tokens.delete(token);
		}

		if (!tokenData || tokenExpired) {
			return res.status(401).json({error: {status: 401, message: 'Invalid access token'}});
		}

		next();
	};
}
