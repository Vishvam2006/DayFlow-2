FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Baileys auth persistence volume mount point
VOLUME ["/app/.baileys-auth"]

EXPOSE 3000

CMD ["node", "dist/index.js"]
