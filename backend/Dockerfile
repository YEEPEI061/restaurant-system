FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY --chown=node:node app.js ./
COPY --chown=node:node server.js ./
COPY --chown=node:node config ./config
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node data ./data
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node models ./models
COPY --chown=node:node routes ./routes
COPY --chown=node:node services ./services
COPY --chown=node:node validators ./validators

USER node

EXPOSE 3000

CMD ["npm", "start"]