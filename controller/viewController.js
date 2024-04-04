const { mongoClient } = require('../config/database');
const s3 = require('../config/s3');

async function getPendingRequests(req, res) {
    try {
        const client = await mongoClient.connect();
        const db = client.db('facerecognition');
        const pendingRequests = await db.collection('reg_req').find({ request: 'pending' }).toArray();
        await client.close();
        if(pendingRequests.length==0){
            res.status(202).send("no pending requests")
        }
        const imagePromises = pendingRequests.map(async (request) => {
            if (request.imageUrl) {
                const params = {
                    Bucket: 'faces-samp',
                    Key: request.imageUrl.split('/').slice(-2).join('/'), // Extracting key from imageUrl
                };
                const data = await s3.getObject(params).promise();
                return {
                    ...request,
                    image: data.Body.toString('base64'), // Convert image data to base64 string
                };
            } else {
                return request; // Return request as it is if imageUrl is not defined
            }
        });
        const images = await Promise.all(imagePromises);
        res.status(200).send({ pendingRequests: images })
    } catch (error) {
        //console.error('Error:', error);
        res.status(500).send("Internal server error")
        //res.status(500).json({ success: true, message: 'Internal server error' });
    }
}


module.exports = { getPendingRequests };
