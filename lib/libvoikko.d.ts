export as namespace libvoikko;

export = libvoikko;

declare function libvoikko(): libvoikko.Libvoikko;

declare namespace libvoikko {
	export interface Libvoikko {
		init(lang: string): Voikko;
	}

	export interface Voikko {
		tokens(text: string): VoikkoToken[];
		analyze(word: string): VoikkoWord[];
	}

	export interface VoikkoToken {
		type: 'WORD' | 'WHITESPACE' | 'PUNCTUATION';
		text: string;
	}

	export interface VoikkoWord {
		BASEFORM: string;
		CLASS: string;
		FSTOUTPUT: string;
		STRUCTURE: string;
		WORDBASES: string;
		NUMBER?: 'singular' | 'plural';
		SIJAMUOTO?: string;
		POSSESSIVE?: '1s' | '2s' | '3s' | '1p' | '2p' | '3p';
		MOOD?: string;
		PERSON?: string;
		TENSE?: string;
	}

}