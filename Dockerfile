# Use the official Node.js image as the base image
FROM node:22-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json to the working directory
COPY package.json ./

# Install dependencies using npm
RUN npm i

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Use a smaller image for the final stage
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the base stage
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/dist ./dist
COPY --from=base /app/generated ./generated

# install dependecy
RUN npm i --production 
RUN npm cache clean --force

# Expose the application port
EXPOSE 3001

# Set the command to start the application
CMD ["node", "dist/main.js"]
