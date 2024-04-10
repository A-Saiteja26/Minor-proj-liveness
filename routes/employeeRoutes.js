const express = require('express')
require('dotenv').config()
const path = require('path')
const bodyParser = require('body-parser')
const router = express.Router()
const {searchFacesAndDelete} = require('../controller/deleteController')
const { searchFacesAndRetrieve } = require('../controller/recognitionController');
const { indexFacesAndStore } = require('../controller/registerController');
const {attendance} = require('../controller/attendanceView')
const { registerNewUser } = require('../controller/requestController');
const {deletePerson} = require('../controller/deletePersonController')
router.get('/recognize', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/employee/recognize.html'));
})
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/employee/register.html'));
})              
router.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
router.use(bodyParser.json());
router.post('/delete_person',deletePerson)
router.post('/mark_attendance', async (req, res) => {


    try {
        await searchFacesAndRetrieve(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/register_person', async (req, res) => {
    try {
        await indexFacesAndStore(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

})



router.post('/register_request', async (req, res) => {
    console.log(req.body)
    try {
        const userData = req.body.userData;
        const photoData = req.body.image;
        //console.log(userData, photoData.length)

        const registrationResult = await registerNewUser(userData, photoData);

        res.status(200).json(registrationResult);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Some error occured to send register request' });
    }
});

router.post('/session',async(req,res)=>{
    console.log(req.body.sessionId)

})
const AWS = require('aws-sdk');


// Configure AWS SDK
console.log(process.env.accessKeyId)
console.log(process.env.secretAccessKey)
AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
});

const s3 = new AWS.S3();
const rp = require('request-promise');
router.post('/sample', async (req, res) => {
    try {
        const sessionId = req.body.sessionId;
        console.log(sessionId)
        const imageKey = `${sessionId}/reference.jpg`; 

        const params = {
            Bucket: "faces-samp-1",
            Key: imageKey
        };

        const data = await s3.getObject(params).promise();

        
        let photoData = Buffer.from(data.Body).toString('base64');
        photoData = `data:image/png;base64,${photoData}`
        
        res.status(200).send(photoData)

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Failed to retrieve and send image data');
    }
});


router.get("/analytics", async (req,res)=>{
    const uname =req.query.uname;
    try {
        await attendance(req,res);
    }catch(err){
        console.log(err)
    }
    console.log(uname);
    
})


module.exports = router
