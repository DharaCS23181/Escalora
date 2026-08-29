FROM node:20-slim

WORKDIR /app

# The dependencies will be mounted as a volume or installed locally during dev
# But we'll copy package files and install so the image has them if run without mounts
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
