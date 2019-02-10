export default class ErrorMessage extends Error {

	public internal: boolean;
	public message: string;

	constructor(opts) {
		super(opts);
		this.internal = opts.internal;
		this.message = opts.message;
		this.stack = new Error().stack;
	}

}
