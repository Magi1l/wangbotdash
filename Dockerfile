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

# Build production server  
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Debug: Check final structure
RUN echo "=== Final structure check ===" && \
    ls -la /app/dist/ && \
    ls -la /app/dist/public/ && \
    test -f /app/dist/public/index.html && echo "index.html found!" || echo "index.html NOT found!"

# Expose port
EXPOSE $PORT

# Start the production server
CMD ["node", "dist/production.js"]