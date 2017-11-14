const { exec } = require('child_process');

let upgrade = (evt, command, cmdArgs) => {
    return new Promise((resolve, reject) => {
        exec('yarn upgrade', (err, stdout, stderr) => {
          if (err) {
            // node couldn't execute the command
            console.log(`stderr: ${stderr}`);
            reject(err);
          }

          // the *entire* stdout and stderr (buffered)
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
          resolve();
        })
    });
}

exports.default = {
    upgrade: upgrade,
    update: upgrade
}
