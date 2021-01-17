var express = require('express');
var router = express.Router();

const { MongoClient } = require('mongodb');
// const url = "mongodb+srv://dbUser:dbUser@cluster0.cejmf.mongodb.net/<dbname>?retryWrites=true&w=majority";
const url = 'mongodb://localhost:27017/';
const dbName = 'UrlShortener';
const jwt = require('jsonwebtoken');


router.post('/', async (req,res)=>{
    try{
      let refresh_token = req.body.token;
      let connection = await MongoClient.connect(url);
      let db = connection.db(dbName);
    
      let user = await db.collection("users").findOne({refresh_token:req.body.token});
  
      if(user){
        let access_token = jwt.sign({userid: user._id},'7b52da02a9b523f56302ded61a1e6dfafef869d655e8310ce6bea1bd38f7649b7e115b30505f6409a6a1ad77c3e1372c8a1759f9696028428f0782679e9d4eb0',{expiresIn:'1m'});
        connection.close();
        
        res.json({
            'access_token':access_token,
          });
      }
      else{
        res.status(401).json({
          'message':'Unauthorized',
          'Description':'Token is incorrect'
        });
      }
    }
    catch(err){
      res.status(500).json({
        'message':'Internal Server Error',
        'description':'Internal Server Error has occured'
      });
    }
    
  });
  
  module.exports = router;