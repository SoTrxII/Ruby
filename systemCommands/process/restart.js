const process = require('process');

let restart = (evt, cmdArg) => {
    return new Promise((resolve, reject) => {
      console.log("restart");
        process.kill(process.pid, 'SIGKILL');
        resolve();
    })
}

exports.default = {
    restart: restart,
    reboot : restart
}
