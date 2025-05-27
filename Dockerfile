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

# Debug: Check what was built
RUN echo "=== Build completed ===" && \
    find . -name "index.html" -type f && \
    ls -la dist/ && \
    ls -la dist/public/ 2>/dev/null || echo "No dist/public directory"

# Build production server  
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Expose port
EXPOSE $PORT

# Start the production server
CMD ["node", "dist/production.js"]