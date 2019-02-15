declare namespace NodeJS  { // tslint:disable-line
	interface Global {
		_: (str: string, ...subs: any[]) => string;
	}
}
