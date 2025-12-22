# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Build the project
RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Run the application (Vite preview/serve)
CMD ["npm", "run", "preview"]
