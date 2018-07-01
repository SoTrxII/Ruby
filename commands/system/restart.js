const {
    kill,
    pid
} = require("process")

/**
 * Make Ruby kill itself, pm2 should restart it then.
 * @desc This is a quick fix to dispatcher ending problem
 */
const restart = async () => {
    kill(pid);
}

exports.default = {
    dansledoute: restart,
    reboot: restart,
    harakiri: restart,
    restart: restart
}

exports.help = {
    'dansledoute': {
        parameters: "",
        desc: "Ajoute une musique à la liste de lecture",
        aliases: "reboot, restart, harakiri"
    },
};