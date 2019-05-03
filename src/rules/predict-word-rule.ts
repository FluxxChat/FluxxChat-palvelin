/* FluxxChat-palvelin
 * Copyright (C) 2019 Helsingin yliopisto
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {Rule, RuleBase} from './rule';
import {TextMessage, RuleParameterTypes, RuleParameters, RoomStateMessage} from 'fluxxchat-protokolla';
import {Connection} from '../connection';
import * as tf from '@tensorflow/tfjs';
import tokenizerFI from '../models/FI/tokenizer.json';
import tokenizerEN from '../models/EN/tokenizer.json';
import FImodelJSON from '../models/FI/model.json';
import ENmodelJSON from '../models/EN/model.json';
import * as fs from 'fs';

let modelFI: tf.Sequential;
let modelEN: tf.Sequential;
if (process.env.ENABLE_PREDICTION) {
	initializeModels();
}

export class PredictWordRule extends RuleBase implements Rule {
	public title = 'rule.predictWord.title';
	public description = 'rule.predictWord.description';
	public ruleName = 'predict_word';
	public parameterTypes = {} as RuleParameterTypes;
	public modelFI: tf.Sequential = modelFI;
	public modelEN: tf.Sequential = modelEN;

	public applyTextMessage(_parameters: RuleParameters, message: TextMessage, sender: Connection): TextMessage {
		if (message.validateOnly) {
			sender.sendMessage({
				type: 'WORD_PREDICTION',
				prediction: predictNextWord(message.textContent, sender.clientLanguage)
			});
		}
		return {...message};
	}

	public applyRoomStateMessage(_parameters: RuleParameters, message: RoomStateMessage, _conn: Connection): RoomStateMessage {
		return {...message, variables: {...message, wordSuggestions: true}};
	}
}

function initializeModels() {
	fs.readFile('./src/models/FI/group1-shard1of3.bin', (err1: Error, data1: Buffer) => {
		if (err1) { throw err1; }
		fs.readFile('./src/models/FI/group1-shard2of3.bin', (err2: Error, data2: Buffer) => {
			if (err2) { throw err2; }
			fs.readFile('./src/models/FI/group1-shard3of3.bin', (err3: Error, data3: Buffer) => {
				if (err3) { throw err3; }
				const weightBuffer = Buffer.concat([data1, data2, data3]).buffer;
				const weightsManifestEntries: tf.io.WeightsManifestEntry[] = [];
				FImodelJSON.weightsManifest[0].weights.forEach((entry: tf.io.WeightsManifestEntry) => {
					weightsManifestEntries.push({name: entry.name, shape: entry.shape, dtype: 'float32'});
				});
				const assignModel = async (weightData: ArrayBuffer) => {
					modelFI = await tf.loadLayersModel(tf.io.fromMemory(
						FImodelJSON.modelTopology,
						weightsManifestEntries,
						weightData
					)) as tf.Sequential;
				};
				assignModel(weightBuffer as ArrayBuffer);
			});
		});
	});
	fs.readFile('./src/models/EN/group1-shard1of2.bin', (err1: any, data1: Buffer) => {
		if (err1) { throw err1; }
		fs.readFile('./src/models/EN/group1-shard2of2.bin', (err2: any, data2: Buffer) => {
			if (err2) { throw err2; }
			const weightBuffer = Buffer.concat([data1, data2]).buffer;
			const weightsManifestEntries: tf.io.WeightsManifestEntry[] = [];
			ENmodelJSON.weightsManifest[0].weights.forEach((entry: tf.io.WeightsManifestEntry) => {
				weightsManifestEntries.push({name: entry.name, shape: entry.shape, dtype: 'float32'});
			});
			const assignModel = async (weightData: ArrayBuffer) => {
				modelEN = await tf.loadLayersModel(tf.io.fromMemory(
					ENmodelJSON.modelTopology,
					weightsManifestEntries,
					weightData
				)) as tf.Sequential;
			};
			assignModel(weightBuffer as ArrayBuffer);
		});
	});
}

function predictNextWord(seedText: string, language: string): string {
	const words = seedText.split(' ').filter(word => word.length > 1 || word.match(/^[a-zA-Z0-9]/));
	if (words.length > 1 && seedText.lastIndexOf(' ') === seedText.length - 1) {
		const model: tf.Sequential = language === 'fi' ? modelFI : modelEN;
		const tokenizer: any = language === 'fi' ? tokenizerFI : tokenizerEN;
		let firstWord: number = tokenizer.word_index[words[words.length - 2]];
		let secondWord: number = tokenizer.word_index[words[words.length - 1]];
		if (!firstWord) {
			firstWord = tokenizer.word_index[Math.floor(Math.random() * Object.keys(tokenizer.word_index).length / 3)];
		}
		if (!secondWord) {
			secondWord = tokenizer.word_index[Math.floor(Math.random() * Object.keys(tokenizer.word_index).length / 3)];
		}
		const prediction = model.predict(tf.tensor2d([firstWord, secondWord], [1, 2], 'float32')) as tf.Tensor2D;
		const predictedClass = tf.argMax(prediction, -1).arraySync() as number;
		return tokenizer.index_word[predictedClass];
	}
	return '';
}
