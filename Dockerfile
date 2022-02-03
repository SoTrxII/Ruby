FROM node:17-alpine as build
# set working directory
WORKDIR /app
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
#RUN apk add git alpine-sdk libtool libsodium libsodium-dev autoconf make automake python3 ffmpeg bash yarn
RUN apk add --update alpine-sdk\
    && apk add git python3 make libtool alpine-sdk libffi-dev openssl-dev python3-dev
# install and cache app dependencies
COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile
# add app
COPY . /app
# generate build
RUN npm run build
# Prune deps, preparing for copy
RUN yarn install --production
############
### prod ###
############
FROM node:17-alpine

# add the required dependencies
WORKDIR /app


RUN npm install -g modclean && apk add --no-cache ffmpeg

COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/yarn.lock /app/package.json  /app/

RUN yarn install --production --frozen-lockfile && modclean -r \
    && modclean -r /usr/local/lib/node_modules/pm2 \
    && yarn cache clean \
    && npm uninstall -g modclean \
    && npm cache clear --force \
    && rm -rf /root/.npm /usr/local/lib/node_modules/npm


CMD ["node", "/app/main.js"]