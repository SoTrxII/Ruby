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
//Discord Constants
const serverId = "152843288565514241";
const Discordtoken = "MjIyMzA1MDIzNTM3NzA5MDYw.Cq7dVg.IVj-MAmvx_9PbaYPuJJV3KIeJAo";

let Discord = require("discord.js");
let spawn = require('electron-spawn');

//Used to speak discord PCM stream out loud
var Speaker = require('speaker');

//Youtube parser and streamer used in reactions
const ytdl = require('ytdl-core');
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');



let guild;
let sceneOuverte;
let receiver;
let dispatcher;
