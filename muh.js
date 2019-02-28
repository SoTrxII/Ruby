   const io = require('socket.io');
   var ss = require('socket.io-stream');
   const sock = io.listen(3003);
   sock.once("connection", socket => {
       console.log("Client connected");
       ss(socket).on('audio-data', (stream, data) => {
           console.log("data");
           stream.pipe(audioStream);
       })
       socket.on('meh', (data) => {
           console.log("Called meh ! ");
           console.log(data);
       })
   })