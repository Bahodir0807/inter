FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
ARG VITE_API_BASE_URL=https://ibrat-backend-hi7w.onrender.com
ARG VITE_APP_ENV=qa
ARG VITE_APP_VERSION=0.0.0
ARG VITE_BUILD_HASH=qa-local
ARG VITE_SENTRY_DSN=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_BUILD_HASH=$VITE_BUILD_HASH
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.qa.conf /etc/nginx/conf.d/default.conf
EXPOSE 4173
