import { kill, pid } from "process";
import { GlobalExt } from "../../@types/global";
declare const global: GlobalExt;

/**
 * Make Ruby kill itself, pm2 should restart it then.
 * @desc This is a quick fix to dispatcher ending problem
 */
const restart = async () => {
  await global.Rin.destroy();
  kill(pid);
};

exports.default = {
  dansledoute: restart,
  reboot: restart,
  harakiri: restart,
  restart: restart
};

exports.help = {
  dansledoute: {
    parameters: "",
    desc: "Ajoute une musique à la liste de lecture",
    aliases: "reboot, restart, harakiri"
  }
};
