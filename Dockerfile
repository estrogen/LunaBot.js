# Use an image that has both Node.js and Git
FROM node:16

# Install git (if not already included in the base image)
RUN apt-get update && apt-get install -y git

# Set the working directory in the container
WORKDIR /usr/src/app

# Your application's default command
CMD ["sh", "-c", "if [ ! -d ./app ]; then git clone ${REPO_URL} ./app; fi && cd ./app && npm install && npm run main"]