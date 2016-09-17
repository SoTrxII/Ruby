//Color.js for logging.
var colors = require('colors/safe')
colors.setTheme({
  normal: ['white', 'italic'],
  input: ['grey'],
  debug: ['blue', 'bold'],
  error: ['red'],
  info: ['green']
});
log("Booting ...", 'info');
var config = require('config');

//Discord Constants
const serverId = config.get('Discord.serverId');
const Discordtoken = config.get('Discord.RubyToken');

let Discord = require("discord.js");
let spawn = require('electron-spawn');

//Used to speak discord PCM stream out loud
var Speaker = require('speaker');

//Youtube parser and streamer used in reactions
const ytdl = require('ytdl-core');
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey(config.get('API.Google.youtubeParser'));



let guild;
let sceneOuverte;
let receiver;
let dispatcher;
