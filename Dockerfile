#############
### build ###
#############

# base image
FROM node:12 as build

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

#add test

# install and cache app dependencies
COPY package.json /app/package.json
RUN apt update && apt install -y libasound2-dev && npm install
# add app
COPY . /app

#Hotfix waiting for the speakermodule to be patched
COPY speakertypes.bak /app/node_modules/speaker/index.d.ts
# generate build
RUN npm run build

############
### prod ###
############

# base image
FROM node:12-alpine

WORKDIR /app
#Install build env
RUN apk update && apk add --no-cache --virtual .build-deps alpine-sdk libtool autoconf automake python shadow curl && \
apk add --no-cache alsa-lib-dev pulseaudio pulseaudio-alsa alsa-plugins-pulse ffmpeg
# copy artifact build from the 'build environment'
COPY --from=build /app/dist /app
#Install hypervisor && prod dependencies
RUN npm install -g pm2 && npm install --only=prod


#Going down from root to normal user
ENV UNAME Ruby
# Set up the user
RUN export UNAME=$UNAME UID=1000 GID=1000 && \
    mkdir -p "/home/${UNAME}" && \
    echo "${UNAME}:x:${UID}:${GID}:${UNAME} User,,,:/home/${UNAME}:/bin/bash" >> /etc/passwd && \
    echo "${UNAME}:x:${UID}:" >> /etc/group && \
    mkdir -p /etc/sudoers.d && \
    echo "${UNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${UNAME} && \
    chmod 0440 /etc/sudoers.d/${UNAME} && \
    chown ${UID}:${GID} -R /home/${UNAME} && \
    gpasswd -a ${UNAME} audio

#Pulse config to acess host audio
COPY pulse-client.conf /etc/pulse/client.conf
#Cleaning up the mess
RUN apk del .build-deps  && rm -rf /var/cache/apk/*

#Runtime
USER $UNAME
ENV HOME /home/Ruby
ENV PORT 8089
# Websocket Port exposed
EXPOSE 8089
CMD ["pm2-runtime", "src/rin.js"]
