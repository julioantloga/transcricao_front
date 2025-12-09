# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copia arquivos de projeto
COPY package*.json ./
COPY . .

# Instala dependências e faz o build
RUN npm install
RUN npm run build

# Etapa 2: Servir com Nginx
FROM nginx:alpine

# Copia o build para a pasta do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove a configuração padrão e adiciona a nossa (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
