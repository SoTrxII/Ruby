# Ruby
A discord music bot in Typescript !

## Commands
The default prefix is **?**.

The command list is : 
 + ?am / ?addMusic : add a music to the playlist. These can either be YouTube videos links or plain text. 
    A plain text input will be queried to the Youtube Data API and the first macthing video will be played.
 + ?pause : Doesn't need explanation
 + ?resume : Doesn't need explanation
 + ?skip: Skip the currently playing song

## Running it 

Ruby requires a Youtube Data API V3 API key and a Discord Bot Token. These can be passed as env variables. 

### Docker

Either pull it from GitHub packages
```sh
# GitHub "public" repository require login in for some reason
docker login docker.pkg.github.com --username <YOUR_USERNAME>
docker pull docker.pkg.github.com/soulcramer/ruby/ruby:latest
```
Or build it yourself
```sh
# In the repo dir, after cloning it
docker build -t docker.pkg.github.com/soulcramer/ruby/ruby:latest . 
```

Whatever you used to get the image, you can run it using :
```sh
docker run \
-e YOUTUBE_PARSER_KEY="<YOUTUBE DATA API V3 key>" \
-e OWNER="<USERS IDS>" \
-e COMMAND_PREFX="?" \
-e RUBY_TOKEN="<DISCORD_BOT_TOKEN>" \
-it docker.pkg.github.com/soulcramer/ruby/ruby:latest
```

#### Docker-compose

```yml
version: '3.7'
services:
    ruby:
     # Be aware that you still need to be logged in to github package 
     # with your GitHub account
     image: docker.pkg.github.com/soulcramer/ruby/ruby:latest
     container_name: ruby
     restart: always
     environment:
       - RUBY_TOKEN=<DISCORD_BOT_TOKEN>
       - YOUTUBE_PARSER_KEY=<YOUTUBE DATA API V3 key>
       - OWNER=<USERS IDS>
       - COMMAND_PREFX=?
```

### Natively
To run this bot natively, you will need libsodium and ffmpeg installed. 
If libsodium isn't installed on your system, node-gyp will attempt to build it, and standard build tools
(autoconf, make, g++, libtool) will be required. Take a look at the Dockerfile for more precise requirements. 

```sh
npm install
npm run build
```

Once all the requirements have been installed, you can then copy the `.env.example` file 
into `.env` and fill in the values.

```sh
cp .env.example .env
# Fill the values in .env...
npm run start:dev
```