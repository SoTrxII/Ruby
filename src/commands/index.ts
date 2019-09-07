import {flatten, uniq, mergeAll, map} from "ramda";

import {sync} from "glob";

const glob_options = {
  realpath: true,
  nodir: true,
    ignore: [`${__dirname}/*(index.js.map)`]
};

const commandsFiles = uniq(
  flatten([
    sync(`${__dirname}/*/index.js`, glob_options),
    sync(`${__dirname}/*/*/index.js`, glob_options),
    sync(`${__dirname}/*(!(help))/*.js`, glob_options),
    sync(`${__dirname}/*(!(index.js))`, glob_options),
  ])
);

// Merge all the commands objecs together and export.
export const commands = mergeAll(
  map(scriptPath => {
    return require(scriptPath).default;
  }, commandsFiles)
);

//Get the help of every command
export const help = mergeAll(
  map(scriptPath => {
    return require(scriptPath).help;
  }, commandsFiles)
);
