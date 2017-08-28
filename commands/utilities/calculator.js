const Promise = require('bluebird');
const maths = require('math-expression-evaluator');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $say
 **/
let calc = (evt, command, cmdArg) => {
    return new Promise((resolve, reject) => {
      try{
        let answer = maths.eval(cmdArg);
        evt.channel.send(`**Question** : \n\t ${cmdArg}
          \n **Réponse** : \n\t ${answer}`);
      }catch(e){
        evt.reply(e.message);
      }
      resolve();

    })
}

exports.default = {
    calc: calc,
    calculate : calc,
    maths : calc,
    c : calc
};

exports.help = {
    'calc': {
      parameters : "calcul à résoudre",
      desc: 'Calculette des familles.',
      aliases : ['calculate', 'maths', 'c']
    }
};
