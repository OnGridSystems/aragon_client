FROM node:12.22 as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY yarn.lock ./
RUN yarn

COPY .babelrc manifest.json now.json ./
COPY images ./images
COPY scripts ./scripts
COPY manifest.json ./
COPY src ./src
COPY arapp.json ./
COPY patches ./patches
RUN yarn patch-package

ARG ARAGON_APP_LOCATOR=ipfs
ARG ARAGON_ENS_REGISTRY_ADDRESS=0x5cb93188c27f6adc771b7c6a13b9a79df2399ae2
ARG ARAGON_IPFS_GATEWAY=https://ipfs.easyswap.finance/ipfs
ARG ARAGON_DEFAULT_ETH_NODE=wss://bsc.easyswap.finance
ARG ARAGON_ETH_NETWORK_TYPE=bsc

RUN yarn build

FROM nginx
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
