import fs from 'fs';

export interface ModelProperties {
	[key: string]: string | boolean;
}

interface Entry {
	name: string;
	data: ModelProperties;
}

let filePath;
let buffer: Entry[] = [];

const serializeEntry = (entry: Entry) => {
	return `${entry.name}#${JSON.stringify(entry.data)}`;
};

/* Model is a superclass for models. The Model class takes care of buffering inserted entries and
 * flushing them on demand. Models should extend this class and define types and a name. Before
 * buffer can be flushed to disk, a file path should be defined (with Model.setFilePath).
 */
abstract class EventModel<T extends ModelProperties> {

	public static setFilePath(path: string) {
		filePath = path;
	}

	public static flush() {
		if (!filePath) {
			throw new TypeError('Could not flush entries: file path not defined');
		}

		if (buffer.length > 0) {
			console.log(`Flushing ${buffer.length} entries`); // tslint:disable-line:no-console

			const data = buffer.map(serializeEntry).join('\n');
			fs.writeFileSync(filePath, data, {flag: 'a'});
			buffer = [];
		}
	}

	public abstract readonly name: string;

	public insert(data: T) {
		buffer.push({name: this.name, data});
	}
}

export default EventModel;
