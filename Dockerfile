FROM node:latest

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 6001

CMD ["node", "app2.js"]
