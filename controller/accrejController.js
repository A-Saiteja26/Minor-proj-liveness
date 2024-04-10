const {indexFacesAndStore,rejectRequest} = require('./registerController');

const accept = async (req, res) => {  
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
                final_res.push(`1 ${id} is registered successfully`);
            }
            console.log(`${id}`, data)
        }
        console.log("final",final_res)
        res.status(200).send(final_res)
        //res.status(200).json({ success: true, message: 'Requests accepted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }


}


const reject = async (req, res) => {
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
}




module.exports={accept,reject};