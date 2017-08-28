const Process = require('process');
const Os = require('os');
/**
 Send system load info.
**/
let stats = (evt, command, cmdArgs) => {
    return new Promise((resolve, reject) => {
        let res = "";
        // Version + Uptime
        res+= `**Ruby** \n\t node version: ${Process.version}\n\t upTime : ${Math.floor(Process.uptime())}s
        \n\tMemory :`
        //Memory
        let memory = Process.memoryUsage();
        for(let item in memory ){
          console.log(item);
          res+=`\n\t\t ${item} : ${Math.round(memory[item] / (1024 *1024))} Mo` // Get in MegaBytes.
        }
        //CPU Load
        res+=`\n\n\tCPU Load:`
        for(let cpuLoad of cpuILoad()){
          res+=`\n\t\t core ${cpuLoad.cpu} : ${Math.round(cpuLoad.percent * 100) /100 } %` // Get in MegaBytes.
        }
        //Send it
        evt.channel.send(res).then( () => {
          resolve();
        }).catch( (e) => {
          Log.error(e);
          reject();
        });

    });
}

exports.default = {
    stats: stats
}
// Cpu average getters.
// INFINITE CLOSURE WORKS
cpuIAverage = (i) => {
  let cpus=Os.cpus(), core=cpus[i], totalIdle =0, totalTick =0;
  for (let type in core.times) {
    totalTick += core.times[type];
  }
  totalIdle += core.times.idle;
  return {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length
  };
};

cpuILoadInit = function() {
  let index=arguments[0];
  return () => {
    let start = cpuIAverage(index);
    return () => {
      let end = cpuIAverage(index);
      return {
        cpu : index,
        percent : 1 - ((end.idle - start.idle) / (end.total - start.total))
      };
    };
  };
}

cpuILoad = (function() {
  let info=[];
  for (let i = 0; i < Os.cpus().length; i++) {
    info.push( cpuILoadInit(i)() );
  }
  return () => {
    let res=[];
    for (let i = 0; i < Os.cpus().length; i++) {
      res.push( info[i]() );
    }
    return res;
  }

})();
