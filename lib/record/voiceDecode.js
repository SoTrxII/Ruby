'use strict';

const fs = require('fs');
const path = require('path');
const opus = require('node-opus');

const rate = 48000;
const frame_size = 1920;
const channels = 2;
const fileExtension = '.opus_string';
let absoluteDirPath = undefined;

let total = 0;
let complete = 0;

let getDecodedFrame = (frameString, encoder, filename) => {
	let buffer = Buffer.from(frameString, 'hex');
	try {
		buffer = encoder.decode(buffer, frame_size);
	} catch (err) {
		try {
			buffer = encoder.decode(buffer.slice(8), frame_size);
		} catch (err) {
			console.log(`${filename} was unable to be decoded`);
			return null;
		}
	}
	return buffer;
};

let convertOpusStringToRawPCM = (file) => {
	return new Promise ( (resolve, reject) => {
		let inputPath = path.join(absoluteDirPath, file);
		let filename = path.basename(file, fileExtension);
		total++;
		let encoder = new opus.OpusEncoder(rate, channels);
		const inputStream = fs.createReadStream(inputPath);
		const outputStream = fs.createWriteStream(path.join(path.dirname(inputPath), `${filename}.raw_pcm`));
		let data = '';
		inputStream.on('data', chunk => {
			data += chunk.toString();
			const frames = data.split(',');
			if (frames.length) {
				data = frames.pop();
			}
			for (let frame of frames) {
				if (frame !== '') {
					const decodedBuffer = getDecodedFrame(frame, encoder, filename);
					if (decodedBuffer) {
						outputStream.write(decodedBuffer);
					}
				}
			}
		});
		inputStream.on('end', () => {
			outputStream.end((err) => {
				if (err) {
					console.error(err);
					reject();
				}
				complete++;
				console.log(`Completed ${100 * complete / total}%`);
				resolve();
			});
		});
	});

};

let convertAllOpusStringToRawPCM = async (inputDirectory) => {
	return new Promise ( (resolve, reject) => {
		fs.readdir(inputDirectory, async (err, files) => {
		 if (err) {
			 console.error(`Could not read input due to: ${err}`);
			 resolve();
			 return;
		 } else {
			 let opusFiles = files.filter( file => {
				 return path.extname(file) === fileExtension;
			 });
			 await Promise.all(opusFiles.map(convertOpusStringToRawPCM));
			 resolve();
		 }
	 });
	})

};

exports.decode = async (aDP) => {
  console.log("Début Decode");
	absoluteDirPath = aDP;
  await convertAllOpusStringToRawPCM(absoluteDirPath);
	console.log("Fin décode");

}
//exports.decode ('/tmp/226641484827459586-1504178479743');
