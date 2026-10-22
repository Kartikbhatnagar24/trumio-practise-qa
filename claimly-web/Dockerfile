FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=7450 API_UPSTREAM=http://127.0.0.1:7460
RUN apk add --no-cache jq
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i -e '/^user /d' -e 's,^pid .*,pid /tmp/nginx.pid;,' /etc/nginx/nginx.conf \
    && grep -q '^pid /tmp/nginx.pid;' /etc/nginx/nginx.conf \
    && chmod -R a+rwX /var/cache/nginx /etc/nginx/conf.d /usr/share/nginx/html
USER 101
EXPOSE 7450
