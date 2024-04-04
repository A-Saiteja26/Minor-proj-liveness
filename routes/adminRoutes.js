const express= require('express')
const router=express.Router()
const path=require('path')
const bodyParser=require('body-parser')
const jwt = require('jsonwebtoken');
const secretKey = 'ThisIsASampleSecretKeyForJWTAuthentication428!'; 
const cookieParser = require('cookie-parser');
const pendingController = require('../controller/pendingController');
const {indexFacesAndStore,rejectRequest} =require('../controller/registerController');
router.use(cookieParser());
router.use(bodyParser.json());

// Middleware to parse incoming request bodies
router.use(bodyParser.urlencoded({ extended: true }));
const cookieController = require('../controller/cookieController');
router.get('/admin',(req,res)=>{
    res.sendFile(path.join(__dirname,'../views/admin/login.html'))
})

router.post("/validatejwt" , async(req , res) => {
    const {token} = req.body;
    try{
        const decoded = jwt.verify(token , secretKey);
        return res.status(200).json({success:true,message:"jwt token verified"});
    }
    catch(err){
        return res.status(401).send("Invalid Token");
    }
})

router.post('/dashboard', (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    if (!user || !pass) {
        return res.status(400).send('Both username and password are required.');
    }

    console.log(user);
    console.log(pass);
    if (user === "saiteja" && pass === "1234") {
        
        const token = jwt.sign({ user: user }, secretKey, { expiresIn: '30m' });

        
        res.status(200).json({
            token: token,
            message: `${user} Welcome, You Are Admin`
        });
    } else {
        res.status(401).send(`${user} You entered invalid credentials`);
    }
});

router.get('/pending-requests',pendingController.pendingRequests);

const viewController = require('../controller/viewController');
//router.get('/view-requests',viewController.getPendingRequests)

router.get('/view-requests', (req, res) => {
    viewController.getPendingRequests(req, res);
});




router.post('/accept', async (req, res) => {  
    console.log(req.body.ids);
    const arr = req.body.ids;
    try {
        let final_res = []
        for (const id of arr) {
            const data= await indexFacesAndStore(id);
            if(data==0){
                final_res.push(`0 ${id} face cannot be registerd because same face is already present `)
            }
            else{
                final_res.push(`1 ${id} is registered  successfully`);
            }
            console.log(`${id}`, data)
        }
        res.status(200).send(final_res)
        //res.status(200).json({ success: true, message: 'Requests accepted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }


});
router.post('/reject',  async (req, res) => {
    console.log(req.body.ids)
    const arr = req.body.ids;
    try {
        for (const id of arr) {
            const data= await rejectRequest(id);
            console.log(`${id}`,data)
        }
        res.status(200).json({ success: true, message: 'Requests rejected successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }/*
    try {
        await rejectRequest(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }*/
});
const getMembers = require('../controller/getMembers');
router.get('/get-members',async (req,res)=>{
     await getMembers.members(req,res);
})
module.exports=router