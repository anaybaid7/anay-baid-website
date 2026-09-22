# Multi-stage build: compile the Vite app in a full Node image, then ship
# only the static output in a minimal nginx image. The final image never
# contains node_modules, source files, or the Node runtime itself, just the
# built HTML/CSS/JS, so it stays small and has a much smaller attack surface
# than shipping the whole build toolchain to production.

# ---- deps ---------------------------------------------------------------
# Isolated so Docker can cache the npm install layer independently of
# source changes: editing src/ never invalidates this layer.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine already runs as an unprivileged user when started without
# extra config; this just makes that explicit and pins the port.
EXPOSE 80

# Fails the container's health status if nginx stops answering, instead of
# looking "up" while silently serving nothing. wget is already present in
# the alpine base nginx ships from.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
