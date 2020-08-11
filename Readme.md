# Ruby
A discord music bot in Typescript !

## Commands
The default prefix is **?**.

The command list is : 
 + ?am / ?addMusic : add a music to the playlist
 + ?pause : Doesn't need explanation
 + ?resume : Doesn't need explanation
 + ?skip: Skip the currently playing song

## Running it 

### Docker

```sh
    docker build -t ruby . 
    docker run ruby
```

### Natively
To run this bot natively, you will need libsodium and ffmpeg installed. 
If libsodium isn't installed on your system, node-gyp will attempt to build it, sand standard build tools
(autoconf, make, g++, libtool) will be required. Take a look at the Dockerfile for more precise reuirements. 
```sh
    npm install
    npm run build
    node dist/src/main.js
```