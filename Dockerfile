# Etapa 1: Build de la app
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./

# Declarar los argumentos que vienen del docker-compose
ARG VITE_API_URL
ARG VITE_IMAGE_SERVER_URL

# Pasarlos como variables de entorno para que Vite los vea
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_IMAGE_SERVER_URL=$VITE_IMAGE_SERVER_URL

RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
