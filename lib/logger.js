'use strict';

//dependencies
const Chalk = require('chalk');

//Presets
const Presets = {
  normal : Chalk.italic.white,
  input : Chalk.grey,
  debug : Chalk.bold.blue,
  error : Chalk.red,
  success : Chalk.green,
  userMessage : Chalk.yellow
};
//Preset that need to be displayed in stdErr instead of stdOut
const stdErr = ["error"];

/**
Display object and string.
@desc
  Function are created on the fly by iterating over the Presets.
  The descriptor is stdOut by default and changed to stdErr with
  the stdErr variable
@param messages Object... messages to Display
**/
for( let presetName in Presets ){
  exports[presetName] = (...messages) => {
    messages.map( (message) => {
      displayMessage(message, Presets[presetName], stdErr.indexOf(presetName) === -1 ? "log" : "error");
    });
  };
};

/**
Prototype function to display on screen
@param message informations to display
@param preset preset to display with. @see Presets on top.
@param descriptor wich stream to write to. (log, err, info (non standard))
**/
let displayMessage = (message, preset="Presets.normal", descriptor="log") => {
  console[descriptor](preset((typeof message === 'string' ) ? `${message}` : JSON.stringify(message)));
};
