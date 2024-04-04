const { mongoClient } = require('../config/database');
const axios = require('axios');
async function attendance(req,res){
    let client;
    try{
        client = await mongoClient.connect();
        const db  = client.db('facerecognition');
        console.log(`${req.query.uname} from inside route`);
        const result = await db.collection('users').findOne({username:req.query.uname});
        console.log(result);

        const response = await axios.post('https://mobile1.qa.darwinbox.io./Mobileapi/auth',{
            username:result.username,
              password:result.password
        }) ;


        console.log(response)
        if(response.status ===200 &&  response.data.token){
            try{

            const resp =await axios.post('https://mobile1.qa.darwinbox.io/Mobileapi/CheckInData',{
              token:response.data.token,
              username:result.username
            });

            //res.status(200).json({"success":true,"message":"done bro"});
            res.status(200).send(resp.data.checkin_details)
            console.log(resp.data.checkin_details);
            return
        }
        catch(error){
            console.log(error);
            res.status(405).json({"success":false,"message":"Some error after hitting mobile api"});
        }
    }
    }
    catch(err){
        console.log("error insideattendanceView",err);
        res.status(402).json({"status":false,"message":"some error bro"});
    }
    
    res.status(200).json("you are hitting api bro");
} 
module.exports= {attendance};