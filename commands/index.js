const glob = require('glob');
const R = require('ramda');


const glob_options = {
  realpath: true,
  nodir: true
};

const commandsFiles = R.uniq(R.flatten([
  glob.sync(`${__dirname}/*(!(index.js))`, glob_options),
  glob.sync(`${__dirname}/*/index.js`, glob_options),
  glob.sync(`${__dirname}/*/*/index.js`, glob_options),
  glob.sync(`${__dirname}/*(!(help))/*.js`, glob_options)
]));

// Merge all the commands objecs together and export.
exports.commands = R.mergeAll(R.map(scriptPath => {
  return require(scriptPath).default;
}, commandsFiles));

//Get the help of every command
exports.help = R.mergeAll(R.map(scriptPath => {
  return require(scriptPath).help;
}, commandsFiles));
