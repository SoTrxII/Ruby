// //External Librairies
// const Promise = require('bluebird');
//
// //Internal Libraries
// const Path = require('path');
// const Fs = require('fs');
// const { exec } = require('child_process');
// const decodeVoices = require(Path.join(global.baseAppDir, 'lib', 'record', 'voiceDecode.js'));
// const syncVoices = require(Path.join(global.baseAppDir, 'lib', 'record', 'voiceSync.js'));
// const fuseVoices = require(Path.join(global.baseAppDir, 'lib', 'record', 'voiceFusion.js'));
// const Utilities = require(Path.join(global.baseAppDir, 'lib','utilities.js'));
// const Log = require(Path.join(global.baseAppDir, 'lib','logger.js'));
//
// let checkDiskRoutineId = undefined;
// /**
// Start a new record session.
// **/
// let startRecord = (evt, command, cmdArg) => {
//   return new Promise( async (resolve, reject) => {
//     if(global.voice.isRecording){
//       evt.reply("Enregistrement déjà en cours.");
//     }else{
//       Utilities.recordCurrentVoiceChannel();
//       global.voice.isRecording = true;
//       //Check if the disk isn't full every minute of recording
//       checkDiskRoutineId = setInterval(async (evt) => {
//          let res = await Utilities.checkDiskSpace();
//          if( res.free < "1.5G") {
//            evt.reply("Quota disque atteint, upload de la première partie.");
//            stopRecord().then((evt) => {
//              startRecord();
//              evt.reply("Enregistrement de la seconde partie");
//              });
//            }
//       }, 60000);
//     }
//     resolve();
//   });
// }
//
// /**
// Stop current recording and upload resulting file into chat.
// **/
// let stopRecord = (evt, command, cmdArg) => {
//   return new Promise( async (resolve, reject) => {
//     if(!global.voice.isRecording){
//       evt.reply("Aucun enregistrement en cours.");
//     }else{
//       global.voice.isRecording = false;
//       processRecord(evt, command, cmdArg);
//       clearInterval(checkDiskRoutineId);
//     }
//     resolve();
//   });
// }
//
//
// /**
// file handling routine.
// **/
// let processRecord = (evt, command, cmdArg) => {
//     return new Promise( async (resolve, reject) => {
//       let path = global.voice.recordPath;
//       console.log(path);
//       //let path = "/tmp/226641484827459586-1504178479743";
//       //Must be sequential no matter what.
//       let replySequence = await evt.reply("Décodage des voix...");
//       await decodeVoices.decode(path).catch((err) => {
//         evt.reply("Erreur :" + err);
//         reject(err);
//       });
//       console.log(replySequence);
//       replySequence.edit("Décodage des voix... --> OK\n\
//       Synchronisation des bruits blancs...")
//       await syncVoices.sync(path);
//       replySequence.edit("Décodage des voix... --> OK\n\
//       Synchronisation des bruits blancs... --> OK\n\
//       Fusion des voix...")
//       fuseVoices.mix(path).then( () => {
//
//         replySequence.edit("Décodage des voix... --> OK\n\
//         Synchronisation des bruits blancs... --> OK\n\
//         Fusion des voix... --> OK\n\
//         Upload...")
//         //Download File
//         console.log(Path.join(global.voice.recordPath, 'output.wav'));
//         waitForFile(Path.join(global.voice.recordPath, 'output.wav')).then( () => {
//           let file =  evt.reply("Here is the crowned prince of douchebags, long may he reigns !", {
//             files : [Path.join(global.voice.recordPath, 'output.wav')]
//           }).then ( () => {
//             deleteTempFiles();
//           });
//         })
//
//
//       })
//
//
//     });
// }
//
// /**
// Wait for a specific file to be accessible via Fs.
// @param filename path to the file.
// **/
// let waitForFile = (filename) => {
//   return new Promise( (resolve, reject) => {
//     Fs.access(filename, Fs.constants.R_OK | Fs.constants.W_OK, (err) => {
//       console.log(err ? 'no access!' : 'can read/write');
//       if(!err){
//         resolve();
//       }else{
//         Utilities.waitFor(1000).then( () => {
//           waitForFile(filename).then ( () => {
//             resolve();
//           });
//         })
//       }
//     });
//   })
//
// }
// /**
// Delete temporary files after recording
// **/
// let deleteTempFiles = () => {
//   return new Promise( (resolve, reject) => {
//     console.log(global.voice.recordPath);
//     exec(`rm -rf ${global.voice.recordPath} `, (error, stdout, stderr) => {
//      if (error){
//        //Errors are not that important
//        Log.error(stderr);
//        reject();
//      }
//      else{
//        resolve();
//      }
//     });
//   });
// }
// exports.default = {
//     startrec : startRecord,
//     stoprec : stopRecord
// };
//
// exports.help = {
//   'startrec': {
//     parameters: '',
//     desc: "Démarre un nouvel enregistrement.",
//   },
//   'stoprec': {
//     parameters: '',
//     desc: "Termine l'enregistrement en cours.",
//   }
// }
