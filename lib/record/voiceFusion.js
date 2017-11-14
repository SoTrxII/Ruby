'use strict';

//Internal Libraries
const Fs = require('fs');
const Path = require('path');
const Child_process = require('child_process');

//Constants
const fileExtension = '.final';
const transitionTime = 2;
let absoluteDirPath = undefined;


let convertFinalToWav = async (file) => {
  const command = `ffmpeg -y -f s16le -ar 48k -ac 2 -i  ${Path.join(absoluteDirPath, file)} ${Path.join(absoluteDirPath, Path.basename(file, fileExtension) + '.wav')}`;
  await doCommand(command);
  return Path.basename(file, fileExtension) + '.wav';
}

let mixWav = async (wavFiles) => {
    let command = `ffmpeg -y`;
    for (let file of wavFiles){
      command += ` -i ${Path.join(absoluteDirPath, file)}`;
    }
    command += ` -filter_complex amix=inputs=${wavFiles.length}:duration=longest:dropout_transition=${transitionTime} ${Path.join(absoluteDirPath, 'output.wav')}`
    //console.log(command);
    await doCommand(command);

}

let doCommand = (command) => {
	return new Promise((resolve, reject) => {
		//console.log('new command');
		let child = Child_process.spawn(command, { shell: true });
		let string = '';
		child.stderr.on('data', (data) => {
			string += data
		});
		child.on('close', (code) => {
			//console.log(code);
			if (code !== 0) {
				//console.log(string);
			}

			resolve(code);
		});
		child.on('error', (err) => {
			//console.log(err);
			reject(err);
		});
	});
};


exports.mix =  (aDP) => {
  return new Promise ( (resolve, reject) => {
    console.log("Début Fusion");
      absoluteDirPath = aDP;
      Fs.readdir(absoluteDirPath, async (err, files) => {
        let finalFiles = files.filter( file => {
          return Path.extname(file) === fileExtension;
        });
        //console.log(finalFiles);
        //Convert all .final files to .wav
        let wavFiles = await Promise.all(finalFiles.map(convertFinalToWav));
        //console.log(wavFiles);
        mixWav(wavFiles).then(resolve());
    });
    console.log("Fin Fusion");
  });


}

//exports.mix('/tmp/226641484827459586-1504178479743');
