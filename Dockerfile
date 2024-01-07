# Use an image that has both Node.js and Git
FROM node:16

# Install git (if not already included in the base image)
RUN apt-get update && apt-get install -y git

# Set the working directory in the container
WORKDIR /usr/src/app

# Declare REPO_URL as an argument
ARG REPO_URL

# Clone the repository and install dependencies
RUN git clone ${REPO_URL} . && npm install

# Your application's default command
CMD ["npm", "run", "main"]