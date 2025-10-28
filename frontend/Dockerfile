# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for vite)
RUN npm install

# Copy source code
COPY . .

# Fix permissions for node_modules binaries
RUN chmod -R +x node_modules/.bin/

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
