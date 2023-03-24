FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY index.js .
COPY helpers.js .
COPY constants.js .
COPY ./voices/ .
COPY ./commands/ .

RUN npm ci

ENTRYPOINT ["npm", "start"]