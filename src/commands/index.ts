import { flatten, uniq, mergeAll, map } from "ramda";

import { sync } from "glob";

const globOptions = {
  realpath: true,
  nodir: true,
  ignore: [`${__dirname}/*(index.js.map)`]
};

const commandsFiles = uniq(
  flatten([
    sync(`${__dirname}/*/index.js`, globOptions),
    sync(`${__dirname}/*/*/index.js`, globOptions),
    sync(`${__dirname}/*(!(help))/*.js`, globOptions),
    sync(`${__dirname}/*(!(index.js))`, globOptions)
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
