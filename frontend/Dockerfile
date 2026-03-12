FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --include=optional

COPY . .
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5173
CMD ["npm", "run", "dev"]
