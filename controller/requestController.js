const { MongoClient } = require('mongodb');
const rekognition = require('../config/aws');
const s3 = require('../config/s3');
const { mongoClient } = require('../config/database');
require('dotenv').config();

async function registerNewUser(userData, photoData) {
  let client;
  try {
    
    client = await mongoClient.connect();
    const db = client.db('facerecognition');

    
    const imageBuffer = Buffer.from(photoData.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    
    const rekognitionResponse = await rekognition.detectFaces({ Image: { Bytes: imageBuffer } }).promise();

    
    if (!rekognitionResponse.FaceDetails || rekognitionResponse.FaceDetails.length !== 1) {
      throw new Error('Exactly 1 face must be detected in the provided image.');
    }

    
    const newUser = {
      name: userData,
      request: 'pending'
    };
    const result = await db.collection('reg_req').insertOne(newUser);

    
    const s3Params = {
      Bucket: 'faces-samp', 
      Key: `detected_faces/${result.insertedId}.jpg`, 
      Body: imageBuffer,
      ContentType: 'image/png',
     
    };


    const s3Response = await s3.upload(s3Params).promise();

    
    await db.collection('reg_req').updateOne({ _id: result.insertedId }, { $set: { imageUrl: s3Response.Location } });

    return { success: true, message: 'User registration request submitted successfully' };
  } catch (error) {
    console.error('Error:', error);
    throw error; 
  }
   finally {
    
    if (client) {
      await client.close();
    }
  }
}

module.exports = { registerNewUser };
