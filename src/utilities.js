/**
*
 * Test function, starts recognition of spoken language and convert it to text.
 *
 * @param  Channel channel Text channel in which the text is to be written
 * @returns None
 * @see Has to be changed. TEST ONLY.
 */
function speechToText(channel){

  var electron = spawn('./standalone/speechWorker.js', {
    detached: false
  });
  electron.stderr.on('data', function (data) {
  if(data.toString() === "end42"){
    speechToText();
  }
  });
  electron.stdout.on('data', function (data) {
    guild.channels.first().sendMessage(data.toString());
  });
}
