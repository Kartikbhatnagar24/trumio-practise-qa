FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=7410 API_UPSTREAM=http://127.0.0.1:7420 API_MODE=mock
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i -e '/^user /d' -e 's,/var/run/nginx.pid,/tmp/nginx.pid,' /etc/nginx/nginx.conf \
    && chmod -R a+rwX /var/cache/nginx /etc/nginx/conf.d /usr/share/nginx/html
USER 101
EXPOSE 7410
