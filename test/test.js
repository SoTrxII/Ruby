let spawn = require('electron-spawn');

function speechToText(){

  var electron = spawn('../speech.js', {
    detached: false
  });
  electron.stderr.on('data', function (data) {
  if(data.toString() === "end42"){
    console.log("reboot");
    speechToText();
  }
  });
  electron.stdout.on('data', function (data) {
    console.log(data.toString());
    //channel.sendMessage(data);
  });
}

speechToText();
