var express = require('express');
var router = express.Router();

const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const url = "mongodb+srv://dbUser:dbUser@cluster0.xroge.mongodb.net/dbUser?retryWrites=true&w=majority";
// const url = 'mongodb://localhost:27017/';
const dbName = 'Cluster0';
const jwt = require('jsonwebtoken');
const shortId = require('shortid');

function authenticate(req, res, next) {
    try {
        jwt.verify(req.headers.authorization, '7b52da02a9b523f56302ded61a1e6dfafef869d655e8310ce6bea1bd38f7649b7e115b30505f6409a6a1ad77c3e1372c8a1759f9696028428f0782679e9d4eb0', function (err, data) {
            if (data) {
                req.body.userid = data.userid;
                next();
            } else {
                res.status(401).json({
                    'message': 'Unauthorized',
                    'description': 'Invalid Token. Please login again'
                });
            }
        });
    }
    catch (err) {
        res.status(500).json({
            'message': 'Internal Server Error',
            'description': 'Internal Server Error has occured'
        });
    }
}

router.get('/', authenticate, async (req, res) => {

    try {
        let refresh_token = req.body.token;

        let connection = await MongoClient.connect(url);
        let db = connection.db(dbName);

        let resultArray = await db.collection("shortUrlCollection").find({"userid":req.body.userid}).toArray();
        connection.close();
        res.json(resultArray);
    }
    catch (err) {
        console.log(err);
    }
});


router.post('/',authenticate, async (req,res)=>{
    try{
        //open the connection
        let connection = await MongoClient.connect(url);
        let db = connection.db(dbName);
        
        let resultArray = await db.collection("shortUrlCollection").find({
            "$and":[
                {
                    'fullUrl':req.body.fullUrl
                },
                {
                    "userid":req.body.userid
                }
            ]
        }).toArray();

        if(resultArray.length==0)
        await db.collection("shortUrlCollection").insertOne({"fullUrl":req.body.fullUrl, "shortUrl": shortId.generate(), "clicks": 0, "userid": req.body.userid});
        //close the connection
        connection.close();
        res.json({
            "message":"url shortened"
        });
    }
    catch(err){
        console.log(err);
    }
});

module.exports = router;