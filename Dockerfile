FROM node:20

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript -> creates dist/
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
