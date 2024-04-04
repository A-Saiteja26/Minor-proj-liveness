const {mongoClient} = require('../config/database');
async function members(req,res){
    let client;
    try {
        client = await mongoClient.connect();
        const db = client.db('facerecognition');
        const usernames = []
        const cursor =await db.collection('users').find({});
        await cursor.forEach(doc => {
            usernames.push(doc.username);
        });
            
        
        console.log(usernames);
        res.status(200).send(usernames);

    }
    catch(error){

        res.status(403).json({success:false,message:"error in fetching data"});
        //console.log("error while connecting Mongo DB",error)
    }

}
module.exports= {members};