const AWS = require('aws-sdk');
require('dotenv').config();
const crypto = require('crypto')
AWS.config.update({
    region: process.env.region,
    credentials: {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey
    }
});
console.log(process.env.REGION)

const rekognition = new AWS.Rekognition();

// Helper function to generate a random string
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        randomString += chars.charAt(randomIndex);
    }
    return randomString;
}


const createLiveSession = async () => {
    const sessionId = generateRandomString(36);
    const params = {
        ClientRequestToken: sessionId,
        Settings: {
            AuditImagesLimit: 2,
            OutputConfig: {
                S3Bucket: process.env.S3_BUCKET_NAMES
            }
        }
    };

    try {
        let temp = await rekognition.createFaceLivenessSession(params).promise();
        return temp?.SessionId;
    } catch (error) {
        console.error('Error creating live session:', error);
        throw new Error('Internal Server Error');
    }
};
const getLiveness=async (req,res)=>{
    let sessionId = req.query.sessionId;
    console.log(sessionId)
    //console.log(req)
        try {
          const data = await rekognition.getFaceLivenessSessionResults({
            SessionId: sessionId
          },(err,data)=>{
            if(!err){
                console.log(data)
                console.log("Confidence",data.Confidence)
                if(Number(data.Confidence) > 70){
                    res.send({isLive:true,
                   confidence:data.Confidence })
                }
                else{
                    res.send({isLive:false,
                        confidence:data.Confidence})
                }
            } else {
                console.error("FATAL ERROR");
                console.log(err)
                res.json({err:"ERRROR"})
            }
          });
        } catch (error) {
          console.error('Error getting live session:', error);
          throw new Error('Internal Server Error');
        }


} 
module.exports={createLiveSession,getLiveness};