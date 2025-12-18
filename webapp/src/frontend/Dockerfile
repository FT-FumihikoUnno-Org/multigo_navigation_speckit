# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app's source
COPY . .

# The app will be started by Vite's development server
EXPOSE 5173

# Define the command to run your app
CMD [ "npm", "run", "dev", "--", "--host" ]
