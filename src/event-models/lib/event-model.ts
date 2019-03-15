import fs from 'fs';

// Get type T without keys K
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Disallowed properties (automatically added/generated)
type Reserved = 'timestamp';

interface ModelPropertiesIndex {
	[key: string]: string | boolean | undefined;
}

export type ModelProperties = ModelPropertiesIndex & {
	[key in Reserved]?: never;
};

interface Entry {
	name: string;
	data: Omit<ModelProperties, 'timestamp'> & {timestamp: string};
}

const serializeEntry = (entry: Entry) => {
	return `${entry.name}#${JSON.stringify(entry.data)}`;
};

/* EventModel is a superclass for event models. The EventModel class takes care of buffering inserted
 * entries and flushing them on demand. Event models should extend this class and provide types for
 * inserted data. Before buffer can be flushed to disk, a file path should be defined (with EventModel.setFilePath).
 */
abstract class EventModel<T extends ModelProperties> {
	public static setFilePath(path: string) {
		this.filePath = path;
	}

	public static flush() {
		if (!this.filePath) {
			throw new TypeError('Could not flush entries: file path not defined');
		}

		if (this.buffer.length > 0) {
			console.log(`Flushing ${this.buffer.length} entries`); // tslint:disable-line:no-console

			const data = this.buffer.map(serializeEntry).join('\n');
			fs.writeFileSync(this.filePath, `${data}\n`, {flag: 'a'});
			this.buffer = [];
		}
	}

	public static insertEntry(name: string, data: ModelProperties) {
		this.buffer.push({
			name,
			data: {...data, timestamp: new Date().toISOString()}
		});
	}

	private static filePath: string;
	private static buffer: Entry[] = [];

	public insert(data: T) {
		EventModel.insertEntry(this.constructor.name, data);
	}
}

export default EventModel;
