# Use the official Node.js image as the base
FROM --platform=${TARGETPLATFORM} node:18
# Set the working directory to /app
WORKDIR /app

# Copy env variables
COPY ./apps/sda/.env.testnet .

# Copy the package.json and yarn.lock files
COPY package*.json yarn.lock ./

# Install the workspace dependencies using yarn first
RUN yarn install

# Copy the application code into the docker container
COPY . .

# Change to the apps/sda directory
WORKDIR /app/apps/sda

# Install the dependencies specifically for the sda app this time
RUN yarn install --network-timeout 900000

# prebuild  
# WORKDIR /app/packages/state
# RUN yarn install
# RUN yarn run build:gql
# WORKDIR /app/apps/sda

# Build the SDA, make sure build doesnt crash 
ENV NODE_OPTIONS=--max_old_space_size=8192

# default
RUN yarn build 
EXPOSE 3000
CMD ["yarn", "run", "start"]

# nginx 
# FROM nginx:1.21.0-alpine as production
# ENV NODE_ENV production
# # Copy built assets from `builder` image
# COPY  --from=builder /app/apps/sda/.next /usr/share/nginx/html
# # Add your nginx.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# # Expose port
# EXPOSE 80
# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]