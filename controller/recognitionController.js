require('dotenv').config();
const rekognition = require('../config/aws');
const { mongoClient } = require('../config/database');
const axios = require('axios');
async function searchFacesAndRetrieve(req, res) {
  let client;
  try {
    client = await mongoClient.connect();
    const db = client.db('facerecognition');
    
    const collectionId = process.env.COLLECTION_ID;

    const imageData = req.body.photoData;

    if (imageData.startsWith('data:image/png;base64,')) {
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

      
      const imageBuffer = Buffer.from(base64Data, 'base64');

     
      const detectParams = {
        Image: { Bytes: imageBuffer }
      };
      const detectResult = await rekognition.detectFaces(detectParams).promise();
      console.log(detectResult)
      if (detectResult.FaceDetails && detectResult.FaceDetails.length === 1) {
       
        const searchParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageBuffer }
        };
        const searchResult = await rekognition.searchFacesByImage(searchParams).promise();

        
        if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
          const faceId = searchResult.FaceMatches[0].Face.FaceId;
          const result = await db.collection('faces').findOne({ faceId: faceId });
          //res.send(`hi , You are recognized ${result.userId}`)
          console.log(result.userId)
          const userdata = await db.collection('users').findOne({username:result.userId});
          console.log(userdata)
          if(!userdata){
            res.status(202).json({success:true,userId: result.userId,message:`${result.userId} is recognized but not a darwin employee`})
            return;
          } 
          try{
            console.log(result.userId)
            const response = await axios.post('https://mobile1.qa.darwinbox.io/Mobileapi/auth',{
              username:userdata.username,
              password:userdata.password
            });
            console.log(response)
            if(response.status ===200 &&  response.data.token){
              try{
              const resp =await axios.post('https://mobile1.qa.darwinbox.io/Mobileapi/CheckInPost',{
                token:response.data.token,
                username:userdata.username,
                location:1
              })
              console.log(resp)
              if(resp.status===200 && resp.data.status===1){
              res.status(200).json({ success: true, userId: result.userId,token:resp.data.token });
              console.log(`${result.userId} a Darwin bro is recognized and also checked in` )
              console.log('token',response.data.token)
              }
              else{
                res.status(401).json({success:false,message:"Could Not Check IN"})             }
            }catch(er){
              console.log("error while handling checkin",er);
              res.status(400).json({success:false,message:"Check IN Failed"})
            }
            }
            else{
              res.status(401).json({success:false,message:"Authentication Failed"});
            }
          }
          catch(err){
            console.log("error while handling authentication",err);
            res.status(500).json({success:false,message:"Internal server Error"});
          }
          //res.status(200).json({ success: true, userId: result.userId });
          //console.log(`${result.userId} bro is recognized` );
        } else {
          res.status(404).json({ success: false, message: 'No matching faces found' });
        }
      } else if (detectResult.FaceDetails && detectResult.FaceDetails.length > 1) {
        res.status(400).json({ success: false, message: `${detectResult.FaceDetails.length} faces are detected` });
      } else {
        res.status(404).json({ success: false, message: 'No faces detected in the provided image' });
      }
    } else {
      // Handle invalid image data format
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

module.exports = { searchFacesAndRetrieve };
     