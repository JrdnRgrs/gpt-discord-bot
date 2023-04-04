FROM node:slim

WORKDIR /app

COPY package*.json ./
COPY index.js .
COPY helpers.js .
COPY constants.js .
COPY README.md .
COPY ./voices/ .
RUN mkdir commands
COPY ./commands/*.js commands/
COPY ./events/*.js events/

RUN npm ci

ENTRYPOINT ["npm", "start"]