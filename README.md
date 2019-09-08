# Ruby

Yet another freaking music bot, but with an animu gal as icon!
![Ruby](https://i.pinimg.com/736x/95/6a/72/956a72e128f787f1c7af24b33b485e81--rwby-rose-rwby-fanart.jpg))

## What does it do ?
Playing fucking music John, you jackass.

There are two main way of making it work. Either in "classical mode" with a discord CLI, or via a Web GUI.
In the Web version, you can play multiple tracks at the same time ! 

### Classical mode
Just use ```$add [YOUTUBE_URL] ``` to add a track in the playlist. The song will be automatically played.
The playback volume can be controlled with ```$volume [0-100]```. Song can be skipped using ```$skip```.

### GUI mode
By using ```$io``` in the discord chat, Ruby will be waiting for orders to arrive via websockets. 
The front-end application is in another repository that I may link when I'll be less tired of your
shit John.

## Does it work ?
Sometimes, yes. 

### How do I make it work then ?
The quickest way to achieve it is to download the latest release on the release page.
Then, you can just copy/paste this:
```bash
yarn install --production
```
If the release thing is broken, because it will probably be, 
you can also clone the repository and copy/paste this :
```bash
yarn install && yarn build && mv -r node_modules dist/node_modules && cd dist/ && npm prune --production
```
Then, do yourself a favor, and go fetch some sweet coffee, because you'll be waiting for a bit. 
You could also use this time to wonder why you are using this instead of coding you own bot. C'mon,
is this really why your mom payed for your CS studies ? That's what I call wasted money.

Still here ? Next is the config file ! Create **config.json** at the root of the directory and
complete it. 
```json
{
  "Discord": {
    "RubyToken": "YOUR_BOT_TOKEN"
  },
  "API": {
    "Google": {
      "youtubeParser": "YOUR_TOKEN"
    }
  }
}
``` 
The token can be found if you very own [discord developper app](https://discordapp.com/developers/applications/).
You should now be able to run Ruby !
 
If you still don't know what to do you can find help [here](https://www.autism.org.uk/services/helplines/main.aspx) 

### How can I use my pudgy little fingers to contribute ?
 
Oh boi. Let's get started.
```bash
git clone https://github.com/soulcramer/Ruby.git
cd Ruby/
# Bitcoin mining
yarn install
```
#### Coding style of some sort
The code is using Eslint and prettier. The configuration is listed under **package.json**, hook it up
with your favorite editor/IDE/Vim/Car/Boat/Rabbit/IDontCare.
 
#### Running the tests
The tests are located in test/ (Duh). `yarn test` will run them. 

#### Documentation
The documentation can be generated with `yarn typedoc`

## License
[MIT](http://opensource.org/licenses/MIT)

