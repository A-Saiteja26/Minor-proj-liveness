const express = require('express');
const AWS = require('aws-sdk');

const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
const {createLiveSession,getLiveness} = require('../controller/liveController')

const router = express.Router()
router.use(bodyParser.json());
router.use(bodyParser.json({ limit: '100mb' }));
router.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

//router.set('view engine', 'ejs');

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
// function generateRandomString(length) {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let randomString = '';
//     for (let i = 0; i < length; i++) {
//         const randomIndex = crypto.randomInt(0, chars.length);
//         randomString += chars.charAt(randomIndex);
//     }
//     return randomString;
// }


// const createLiveSession = async () => {
//     const sessionId = generateRandomString(36);
//     const params = {
//         ClientRequestToken: sessionId,
//         Settings: {
//             AuditImagesLimit: 2,
//             OutputConfig: {
//                 S3Bucket: process.env.S3_BUCKET_NAMES
//             }
//         }
//     };

//     try {
//         let temp = await rekognition.createFaceLivenessSession(params).promise();
//         return temp?.SessionId;
//     } catch (error) {
//         console.error('Error creating live session:', error);
//         throw new Error('Internal Server Error');
//     }
// };

router.get('/api/get',getLiveness)

router.get('/api/', async (req, res) => {
    try {
        const sessionId = await createLiveSession();
        res.json({sessionId});
    } catch (error) {
        console.error('Error creating live session:', error);
        res.status(500).send('Error creating live session');
    }
});


module.exports=router