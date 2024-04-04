require('dotenv').config();
const rekognition = require('../config/aws');
const { mongoClient } = require('../config/database');
const axios = require('axios');
async function searchFacesAndDelete(req, res) {
    let client;
    try {
      client = await mongoClient.connect();
      const db = client.db('facerecognition');
      
      const collectionId = process.env.COLLECTION_ID;
      const imageData = req.body.photoData;
      console.log("imageData",imageData)
      if (imageData.startsWith('data:image/png;base64,')) {
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const detectParams = {
          Image: { Bytes: imageBuffer }
        };
        const detectResult = await rekognition.detectFaces(detectParams).promise();
        if (detectResult.FaceDetails && detectResult.FaceDetails.length === 1) {
          const searchParams = {
            CollectionId: collectionId,
            Image: { Bytes: imageBuffer }
          };
          console.log(detectResult);
          const searchResult = await rekognition.searchFacesByImage(searchParams).promise();
          console.log(searchResult)
          if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
            const faceId = searchResult.FaceMatches[0].Face.FaceId;
            let data=await rekognition.deleteFaces({ CollectionId: collectionId, FaceIds: [faceId] }).promise();
            console.log(data.DeletedFaces[0]);
            console.log(req.body._id)
            const result = await db.collection('faces').findOne({ faceId:data.DeletedFaces[0]});
            console.log(result)
            data = await db.collection('faces').deleteOne({faceId:data.DeletedFaces[0]});
            console.log(data.deletedCount);
            
            if(data.deletedCount){
            console.log(`${result.userId} is deleted`);
            res.status(200).json({ success: true, message: 'Face and associated document deleted successfully',name:result.userId });}
          } else {
            console.log('No matching Faces Found')
            res.status(404).json({ success: false, message: 'No matching faces found' });
          }
        } else if (detectResult.FaceDetails && detectResult.FaceDetails.length > 1) {
          res.status(400).json({ success: false, message: `${detectResult.FaceDetails.length} faces are detected` });
        } else {
          res.status(404).json({ success: false, message: 'No faces detected in the provided image' });
        }
      } else {
        
        console.error('Invalid image data format');
        res.status(400).json({ success: false, message: 'Invalid image data format' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      
      if (client) {
        await client.close();
      }
    }
  }
module.exports={searchFacesAndDelete}