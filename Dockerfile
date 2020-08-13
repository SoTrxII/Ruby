FROM node:current-alpine as build
# set working directory
WORKDIR /app
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
# install and cache app dependencies
COPY package.json /app/package.json 

RUN apk add git alpine-sdk libtool autoconf automake python ffmpeg && npm install
# add app
COPY . /app
# generate build
RUN npm run build
############
### prod ###
############
FROM node:current-alpine

# add the required dependencies
WORKDIR /app

COPY --from=build /app/dist /app

RUN npm install -g pm2 modclean \
    && apk add --no-cache --virtual .build-deps git alpine-sdk libtool autoconf automake python ffmpeg \
    && npm install --only=prod \
    && modclean -r \
    && modclean -r /usr/local/lib/node_modules/pm2 \
    && npm uninstall -g modclean \
    && npm cache clear --force \
    && apk del .build-deps \
    && rm -rf /root/.npm /usr/local/lib/node_modules/npm

CMD ["pm2-runtime", "/app/main.js"]