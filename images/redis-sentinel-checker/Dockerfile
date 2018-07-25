FROM node:10.6.0-alpine
RUN mkdir -p /app
WORKDIR /app
COPY app /app
RUN npm install
CMD ["node", "/app/sentinel-check.js"]
EXPOSE 9999
