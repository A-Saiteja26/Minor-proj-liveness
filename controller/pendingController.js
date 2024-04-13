const { mongoClient } = require('../config/database');

async function pendingRequests(req, res) {
    let client;
    try {

        client = await mongoClient.connect();
        const db = client.db('facerecognition');
        const pendingRequests = await db.collection('reg_req').find({ request: 'pendings' }).toArray();

        if (pendingRequests.length > 0) {
            res.status(200).json({ success: true, message: 'There are pending requests.', pendingRequests });
        } else {
            res.status(202).json({ success: false, message: 'No pending requests found.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }finally {
        try{
        if (client) {             
            await client.close();
        }}
        catch(error){
            res.status(500).json({ success: false, message: 'Internal server error' })
        }
    }
}

module.exports = { pendingRequests };
