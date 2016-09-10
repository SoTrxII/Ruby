var Speech = require('electron-speech')

var recog = Speech({
  lang: 'fr-Fr',
  continuous : false
})
recog.on('text', function (text) {
  process.stdout.write(text);
});

//recog.pipe(process.stdout);
recog.listen();
//recog.on('end', function() { process.exit(0) });
recog.on('end', function() { process.stderr.write('end42'); process.exit(0) });
