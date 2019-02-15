export class Lexer {
	regexs: RegExp[];
	lex(text: string): string[];
}
export class Tagger {
	lexicon: Lexicon;
	extendLexicon(lexicon: Lexicon): void;
	prettyPrint(taggedWords: Array<[string, POS]>): void;
	tag(words: string[]): Array<[string, POS]>;
	wordInLexicon(word: string): bool;
}

export interface Lexicon {
	[word: string]: string[];
};

export type POS =
	'CC' | 'CD' | 'DT' | 'EX' |
	'FW' | 'IN' | 'JJ' | 'JJR' |
	'JJS' | 'LS' | 'MD' | 'NN' |
	'NNP' | 'NNPS' | 'NNS' | 'POS' |
	'PDT' | 'PP$' | 'PRP' | 'RB' |
	'RBR' | 'RBS' | 'RP' | 'SYM' |
	'TO' | 'UH' | 'VB' | 'VBD' |
	'VBG' | 'VBN' | 'VBP' | 'VBZ' |
	'WDT' | 'WP' | 'WP$' | 'WRB' |
	',' | '.' | ':' | '$' |
	'#' | '"' | '(' | ')';