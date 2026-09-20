FROM node:20-alpine
WORKDIR /app

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

