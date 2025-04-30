# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Expose port (adjust if your app uses a different one)
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]
