FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --production

# Copy application source
COPY index.js ./
COPY src/ ./src/

# Expose the port Railway will route traffic to
EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]
