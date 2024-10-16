FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci --production
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
ENV DB_URL mongodb://mongo:27017/iterpro
ENV PASSWORD 44KXwCOIjdZDzbiXsSoNQXwIK
ENV SALT oldrleovjja0jz7h
ENV ITERATION 100
ENV HASHBYTES 16
ENV ALGORITHM sha1
ENV IV cd5c632d26fde5e2eb61e521ad2b91ba
ENV ENCALGORITHM aes-128-cbc
ENV EMAIL info@iterpro.com
ENV EMAILPWD george&carlin87

EXPOSE 8080
CMD [ "npm", "start" ]
