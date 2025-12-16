FROM node:20-alpine

RUN addgroup -S appuser && adduser -S -G appuser appuser

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chown -R appuser:appuser /usr/src/app

ENV NODE_ENV=production
EXPOSE 3001
USER appuser
CMD ["node", "server.js"]
