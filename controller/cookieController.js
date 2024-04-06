// cookieController.js
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path=require('path');
const jwt = require('jsonwebtoken');
const secretKey = 'ThisIsASampleSecretKeyForJWTAuthentication428!'; 
// exports.checkCookie = ((req, res, next)=> {
//     const cookieName = 'user'; 
//     if (req.cookies && req.cookies[cookieName] !== null && req.cookies[cookieName] !== undefined) {
        
//         //next();
//     } else {
        
//         res.sendFile(path.join(__dirname, '../views/admin/login.html'));
//     }
// })


const temp = async (req , res)=>{
    const {token} = req.body;
    try{
        const decoded = jwt.verify(token , secretKey);
        return res.status(200).json({success:true,message:"jwt token verified"});
    }
    catch(err){
        return res.status(401).send("Invalid Token");
    }
}

module.exports = {temp}