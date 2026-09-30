FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Allow production API URL to be injected at build time via --build-arg
# e.g. docker build --build-arg VITE_API_URL=https://your-backend.host/api .
# Falls back to whatever is in .env if not provided.
ARG VITE_API_URL
ARG VITE_R2_PUBLIC_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_R2_PUBLIC_URL=${VITE_R2_PUBLIC_URL}

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]