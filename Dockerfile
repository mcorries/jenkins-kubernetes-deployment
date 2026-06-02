# STAGE 1: Build Environment
FROM node:24-alpine AS build-stage
WORKDIR /react-app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# STAGE 2: Production Server
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /react-app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
