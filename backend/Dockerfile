FROM node:22-bookworm-slim

WORKDIR /app

# Copiamos primero package.json y package-lock.json
COPY package*.json ./

# Instalamos las dependencias
RUN npm ci

# Copiamos TypeScript y el código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilamos TypeScript
RUN npm run build

# Puerto utilizado por Express
EXPOSE 3000

# Iniciar versión compilada
CMD ["npm", "start"]