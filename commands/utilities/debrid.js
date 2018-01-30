
//External Librariries
const Promise = require('bluebird');
const Path = require('path');
const Request = require('request');


//Internal Librariries
const Log = require(Path.join(global.baseAppDir, 'lib', 'logger.js'));
const Utils = require(Path.join(global.baseAppDir, 'lib', 'utilities.js'));

//Constants
//Constructed as a function for the auto-refs
//@NOTE : ES6 '=>' seems to bug out here.
const AlldebridLinks = new ( function(){
  this.root = 'https://alldebrid.com';
  this.login = this.root + '/register/';
  this.infos = this.root + '/account/';
  this.debrid = this.root + '/service.php';
})();
//Cookies jar
const session = Request.jar();
let logged = false;
let debrid =  (evt, command, cmdArg) => {
    return new Promise((resolve, reject) => {
      if(!logged){
        //Retry to login
        connectToAccount().catch( () => {
          reject("Can't debrid links without loggin in beforehand.")
        });
      }else{
        //If already logged in
        console.log("Envoi de la reqûete");
        let debrid = Request({
          url : AlldebridLinks.debrid,
          jar : session,
          headers : {
            'User-Agent' : "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9(KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5"
          },
          proxy : "http://37.59.47.13:3128",
          qs : {
            link : cmdArg,
            json : 'true'
          },
          method : 'GET'
        }, function (error, res, data) {
          if(!error && res.statusCode == 200){
            console.log(res.body)
            let json = JSON.parse(data);
            if(!json.error){
              let urlEmbed = Utils.createEmbed({
                url : json.link
              });
                evt.channel.send(`Lien débridé !.\n ${encodeURI(json.link)} `);
                resolve();
            }else{
              evt.reply(`Impossible de débrider le lien.\n Raison : \n " ${json.error} "`, {

              });
              reject(json.error);
            }
          }else{
            reject("Impossible d'envoyer la requête");
          }
        })
      }

    })
}

let connectToAccount = () => {
  return new Promise((resolve, reject) => {
    //Get the credentials from config.
    let username, password;

    try{
      username = global.Config.API.Alldebrid.login;
      password = global.Config.API.Alldebrid.password;
    }catch(e){
      //if config file is malformed.
      Log.error("Failed to get Alldebrid username and/or password");
      reject(e);
    }

    //If username/pass is "" or {} or anything that equate to false.
    if(!username || !password){
      Log.error("Failed to get Alldebrid username and/or password")
      reject("Invalid Alldebrid username and/or password");
    }
    let connection = Request({
      url : AlldebridLinks.login,
      jar : session,
      headers : {
        'User-Agent' : "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9(KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5"
      },
      qs : {
        action : 'login',
        returnpage : '/account/',
        login_login : username,
        login_password : password,
        method : 'GET'
      }
    }, function (error, res, data) {
      //If there is no error is the response and we are and the requested callback page,
      //Everything is allright
      if(!error && res.statusCode == 200 && connection.uri.href == AlldebridLinks.infos){
        resolve("Logged");
      }else{
        Log.error(res.body);
        reject("Could not log in");
      }
    });

  });
};

connectToAccount().then(() => {
  logged = true;
  Log.success("Successfully logged in (Alldebrid)");
}).catch(Log.error);
console.log(logged);


exports.default = {
    debrid: debrid,
};

exports.help = {
    'debrid': {parameters : "lien", desc: 'Débride un lien'}
};
