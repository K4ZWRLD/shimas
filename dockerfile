# Use an official Node.js image with Debian (needed for native builds)
FROM node:20-bullseye

# Install system dependencies required for canvas
RUN apt-get update && apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libuuid1 \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install Node.js dependencies (including canvas)
RUN npm install

# Copy rest of your app
COPY . .

# Set environment variables for production (optional)
ENV NODE_ENV=production

# Run your postinstall script to deploy commands
RUN npm run postinstall

# Expose the port your bot might use (optional if not HTTP)
EXPOSE 3000

# Start your bot
CMD ["npm", "start"]
