const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config()

AWS.config.update({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS
    }
  },true)

// Set up Rekognition
const rekognition = new AWS.Rekognition();
module.exports=rekognition