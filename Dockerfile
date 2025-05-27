FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create public directory and copy built files
RUN mkdir -p public && cp -r dist/* public/ 2>/dev/null || true

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]