//External Librairies
const Promise = require('bluebird');
const Path = require('path');
const Fs = require('fs');

//Constants
const baseAppDir = Path.join(__dirname, '../../');
const soundDir = Path.join(baseAppDir, 'sounds');

//Internal Librairies
const Log = require(Path.join(baseAppDir, 'lib', 'logger.js'));
//AudioFile aliases.
//@NOTE Implemented as Array : String
// The dictionnary keys are Arrays which are bound to be small.
// Plus, Js's native Set/Hash table implementation has a complexity of O(n)
// Array colection should suffice for this one
const aliases = {
  'corbeau.mp3' :   ['mabite', 'corbeau'],
  'HEYYEYAAEYAAAEYAEYAA.mp3' : ['yeah'],
  'inception.mp3' : ['inception', 'dramatic']
}

const streamOptions = {
  volume : 0.11,
  passes : 1
}

/**
@param evt Event leading to this command
@param cmdArg Alias of the file to play
@return Promise resolving after all the file has been played.
**/
let playFile = (evt, command, cmdArg) => {

  return new Promise( (resolve, reject) => {
    let filename = searchForFileName(command);
    if(!filename){
      reject(cmdArg + " is not associated with any file. Cannot play sound");
    }
    let filepath = Path.join(soundDir, filename);
    Fs.access(filepath, Fs.constants.F_OK | Fs.constants.W_OK, (err) => {
      if(err){
        reject("Cannot find or read file " + filename);
      }
    });

    global.voice.dispatcher = global.voice.connection.playFile(filepath, streamOptions);

    global.voice.dispatcher.on('end', (reason) => {
      Log.debug("Fin de lecture du fichier : " + filename);
      resolve(reason);
    });

    global.voice.dispatcher.on('error', (error) => {
      //global.voice.dispatcher.destroy();
      reject(error);
    });

    global.voice.dispatcher.on('debug', (info) => {
      Log.debug(info);
    });

  })

}
/**
Search the file to play given a possible alias
@param needle alias to search
@return file name to play (basename) or false if not found.
**/
let searchForFileName = (needle) => {
  for(let alias in aliases){
    if(aliases[alias].indexOf(needle) !== -1){
      return alias;
    }
  }
  return false;
}

let generateCommands = () => {
  let commands = {};
  for(let alias in aliases){
    for(let elem of aliases[alias] ){
      commands[elem] = playFile
    }
  }
  return commands;
}

exports.default = generateCommands();

exports.help = {
  'mock': {parameters: 'what to say'}
};
