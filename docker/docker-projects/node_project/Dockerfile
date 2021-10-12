FROM node:14-alpine


WORKDIR /app

COPY package*.json ./
COPY ormconfig.json ./
COPY .env ./

RUN npm install

COPY ./dist .

EXPOSE 5000

CMD [ "node", "index.js" ]
# CMD [ "npm", "start" ]