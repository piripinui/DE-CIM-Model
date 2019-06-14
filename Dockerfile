FROM node:8

# Create app directory
WORKDIR /usr/src/app

COPY DE_CIM_Model ./DE_CIM_Model
COPY json-schema-viewer ./json-schema-viewer
COPY schema-validator ./schema-validator

WORKDIR /usr/src/app/schema-validator
RUN npm install

WORKDIR /usr/src/app/json-schema-viewer
RUN npm -g install bower
RUN bower install --allow-root
RUN npm install
RUN npm -g install grunt
RUN npm -g install sass
RUN grunt dev
WORKDIR /usr/src/app

RUN npm install -g http-server

EXPOSE 8080
CMD [ "http-server" ]
