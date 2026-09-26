# ============================================================
# ETAPA 1 - COMPILAR ANGULAR
# ============================================================

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ============================================================
# ETAPA 2 - NGINX
# ============================================================

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /tmp/dist

RUN mkdir -p /usr/share/nginx/html \
    && cp -r /tmp/dist/*/browser/* /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]