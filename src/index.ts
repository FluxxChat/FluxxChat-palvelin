import express from 'express';

const app = express();

// Fallback to index.html
app.get('/', (_req, res) => {
	return res.json({message: 'Hello World!'})
});

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
