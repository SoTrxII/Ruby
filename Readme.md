# Ruby
[![codecov](https://codecov.io/gh/SoTrxII/Ruby/branch/master/graph/badge.svg?token=03MG2E264Z)](https://codecov.io/gh/SoTrxII/Ruby)


A Discord music bot, compatible with both slash commands and "normal" commands !

## Commands

**Slash commands being all the rage right now, you can use any of the below commands with a /.**

You can also use normal commands. The default prefix is **?**. This can be changed via a command line argument.

| Command         | Description                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ?play <url>     |  A YouTube videos links or plain text. A plain text input will be queried to the Youtube Data API and the first matching video will be played. |
| ?pause          | Pause playback                                                                                                                                                                                              |
| ?resume         | Resume playback                                                                                                                                                                                             |
| ?skip           | Skip the currently playing song                                                                                                                                                                             | |
| ?stop           | Stop playback
| ?help           | Shows help string. Only useful for "normal" commands
## Running it

Ruby requires a Youtube Data API V3 API key and a Discord Bot Token. These can be passed as env variables.

### Docker

Either pull it from GitHub packages

```sh
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
-e COMMAND_PREFX="?" \
-e RUBY_TOKEN="<DISCORD_BOT_TOKEN>" \
-it docker.pkg.github.com/soulcramer/ruby/ruby:latest
```

#### Docker-compose

```yml
version: "3.7"
services:
  ruby:
    image: docker.pkg.github.com/soulcramer/ruby/ruby:latest
    container_name: ruby
    restart: always
    environment:
      - RUBY_TOKEN=<DISCORD_BOT_TOKEN>
      - YOUTUBE_PARSER_KEY=<YOUTUBE DATA API V3 key>
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

## Conception

Here's a gist of what Ruby looks like. Be aware **Dependency injection is used**, and for simplicity's
sake, this is not shown in the below class diagram.

![Class diagram](https://yuml.me/3e701ee9.svg)

+ CommandLoader : Recognize and executes all the commands
  + Commands : Given a context and a Jukebox, executes users commands on the Jukebox
+ Context : The type of interaction the user sent 
  - MessageContext : A "classic" command, with a prefix like "?play" 
  - InteractionContext : A slash command, like /play. This is actually a completely different workflow.
+ Jukebox : a state machine keeping track of all user demands
  - YoutubeEngine : Song input. Parses songs from Youtube. Changing just the engine would allow for a Soundcloud music bot*
  - DiscordSink : Song output. Outputs songs in discord. Multi shard for future-proofing. 