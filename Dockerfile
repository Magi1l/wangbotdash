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

# Ensure client files are in the right place
RUN ls -la dist/ && echo "Contents of dist directory"

# Expose port
EXPOSE $PORT

# Start the production server
CMD ["node", "dist/production.js"]