# Build stage (Usado para Produção)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Development stage (Servido pelo Vite com Hot Reload)
FROM node:20-alpine as dev
WORKDIR /app
COPY package*.json ./
RUN npm install
# O código será montado via volume no docker-compose.yml
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage (Servido via Nginx)
FROM nginx:stable-alpine as prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
