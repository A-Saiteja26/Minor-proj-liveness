require('dotenv').config();
const rekognition = require('../config/aws');
const { mongoClient } = require('../config/database');
const s3 = require('../config/s3');
const { MongoClient, ObjectId } = require('mongodb');
async function indexFacesAndStore(id) {
  let client;
  try {
      client = await mongoClient.connect();
      const db = client.db('facerecognition');
      const collectionId = process.env.COLLECTION_ID;
      const request = await db.collection('reg_req').findOne({ _id: new ObjectId(id) });

      if (!request) {
          return "request not found"
          //return res.status(404).json({ success: false, message: 'Request not found' });
      }
      const imageUrl = request.imageUrl;

      const s3Params = {
          Bucket: 'faces-samp-new',
          Key: imageUrl.split('/').slice(-2).join('/')
      };
      const imageData = await s3.getObject(s3Params).promise();
      const collectionparams = {
        CollectionId: 'samp_collection'
      };
      rekognition.describeCollection(collectionparams, function(err, data) {
        if (err && err.code === 'ResourceNotFoundException') {
          // Collection does not exist, create it
          rekognition.createCollection(collectionparams, function(err, data) {
            if (err) {
              console.log("Error creating collection:", err);
            } else {
              console.log("Collection created successfully:", data.CollectionArn);
            }
          });}
        });
        
      const indexParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageData.Body } 
      };
      const detectParams = {
        Image: { Bytes: imageData.Body }
      };
      const detectResult = await rekognition.detectFaces(detectParams).promise();
      if (detectResult.FaceDetails && detectResult.FaceDetails.length === 1) {
      const searchResult = await rekognition.searchFacesByImage(indexParams).promise();
      if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
        //res.status(302).json({success:false,message:"This face is alreday registered now we cannot register now"});
        return 0;
      }
      const indexResponse = await rekognition.indexFaces(indexParams).promise();

      const faceData = {
          userId: request.name,
          faceId: indexResponse.FaceRecords[0].Face.FaceId
      };
      await db.collection('faces').insertOne(faceData);

      await db.collection('reg_req').updateOne(
          { _id: new ObjectId(id) },
          { $set: { request: 'accepted' } }
      );
        return 1
      }
      else if (detectResult.FaceDetails && detectResult.FaceDetails.length > 1) {
        return 1;
        //res.status(400).json({ success: false, message: `${detectResult.FaceDetails.length} faces are detected` });
      } else {
        return('No faces detected in the provided image');
        //res.status(404).json({ success: false, message: 'No faces detected in the provided image' });
      }
      //res.status(200).json({ success: true, message: 'Face indexed and stored successfully' });
  } catch (error) {
      console.log('Error:', error);
      return "internal server error"
      //res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
      if (client) {
          await client.close();
      }
  }
}





async function rejectRequest(id) {
  try {
      const client = await mongoClient.connect();
      const db = client.db('facerecognition');

      const result = await db.collection('reg_req').updateOne(
          { _id: new ObjectId(id) },
          { $set: { request: 'rejected' } }
      );

      await client.close();
        return "request rejected successfully"
      //res.status(200).json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
      console.error('Error:', error);
      return "Internal Server Error"
      //res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { indexFacesAndStore,rejectRequest};
