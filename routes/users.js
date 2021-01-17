var express = require('express');
var router = express.Router();

const emailValidator = require('email-validator');
const passwordValidator = require('password-validator');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const url = "mongodb+srv://dbUser:<password>@cluster0.xroge.mongodb.net/<dbname>?retryWrites=true&w=majority";
// const url = 'mongodb://localhost:27017/';
const dbName = 'Cluster0';
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

function validateInputs(req,res,next){
  let passwordValidatorSchema = new passwordValidator();
  passwordValidatorSchema.is().min(8).has().uppercase(1).has().lowercase(1).has().digits(1);

  if(emailValidator.validate(req.body.email) && passwordValidatorSchema.validate(req.body.password) && req.body.name!=null && req.body.name!='')
  {
    next();
  }
  else{
    res.status(400).json({
      'error':'400',
      'message':'Invalid Request',
      'description':'Name should not be null, Password must have atleast 1 capital letter and symbol'
    });
  }
}

async function isNewUserCheck(req,res,next){
  let connection = await MongoClient.connect(url);
  let db = connection.db(dbName);
  let isEmailAreadyPresent = await db.collection("users").findOne({"email":req.body.email});
  connection.close();

  if(isEmailAreadyPresent){
    res.status(409).json({
      'message':'email already taken',
      'description':'An user already exists with the same email'
    });
  }
  else{
    next();
  }
}

router.post('/signup', validateInputs, isNewUserCheck, async (req,res)=>{
  try{
    let connection = await MongoClient.connect(url);
    let db = connection.db(dbName);

    let salt = await bcrypt.genSalt();
    let hash = await bcrypt.hash(req.body.password, salt);

    await db.collection('users').insertOne({'name':req.body.name, 'email':req.body.email, 'password':hash});
    connection.close();
    res.json({
        'message':'user created'
    });
  }
  catch(err){
    console.log(err);
    res.json({
      "message":err
    });
  }
});

router.post('/login',async (req,res)=>{
  try{

    let connection = await MongoClient.connect(url);
    let db = connection.db(dbName);

    let user = await db.collection("users").findOne({email:req.body.email});

    if(user){
      let compare = await bcrypt.compare(req.body.password, user.password);
      if(compare){

        let access_token = jwt.sign({userid: user._id},'7b52da02a9b523f56302ded61a1e6dfafef869d655e8310ce6bea1bd38f7649b7e115b30505f6409a6a1ad77c3e1372c8a1759f9696028428f0782679e9d4eb0',{expiresIn:'10m'});
        let refresh_token = jwt.sign({userid: user._id},'43dab091da0f3066617dd2b3f9380f69f1bdead1e3b1dfe9ad6cb0cdeab3ec22fa0f446138206b4d736545cbd553582d73402f783e0c5aa1dce68fb33c1f04a0');

        await db.collection('users').updateOne({'_id':user._id},{$set: {'refresh_token':refresh_token}});
        connection.close();
        res.json({
          'message':'Login success',
          'description':'user logged in',
          'access_token':access_token,
          'refresh_token':refresh_token
        });
      }
      else{
        connection.close();
        res.status(401).json({
          'message':'Unauthorized',
          'description':'User Id or Password is Incorrect'});
      }
    }
    else{
      res.status(401).json({
        'message':'Unauthorized',
        'description':'User Id or Password is Incorrect'});
    }
  }
  catch(err){
    console.log(err);
  }
});

router.post('/logout',async (req,res)=>{
  try{

    let connection = await MongoClient.connect(url);
    let db = connection.db(dbName);
  
    let user = await db.collection("users").findOne({refresh_token: req.body.token});
    console.log(user);
    await db.collection('users').updateOne({'_id':user._id},{ $unset: { 'refresh_token': '' }});
    connection.close();
    res.json({
      'message':'User Logged out Successfully'
    });
  }
  catch(err){
    res.status(500).json({
      'message':'Internal Service Error'
    });
  }
});

module.exports = router;
