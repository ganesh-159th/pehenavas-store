FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

EXPOSE 3000
EXPOSE 3001

CMD ["npm", "run", "dev"]
