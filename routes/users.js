const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
router.use(cookieParser('twa'));
require('dotenv').config({ path: './.env' });

var db;
MongoClient.connect(process.env.MONGODB_URL)
.then(client =>{
    db = client.db('horiken');
})
.catch((e)=>{
    console.log(e)
    console.log('DB connection error !')
})


/* GET users listing. */
router.get('/', function (req, res, next) {
   res.redirect('/')
/*
  let myCollection = db.collection('users')
  myCollection.find().toArray((err, results) => { 
      res.send({results:results,cookies:req.signedCookies}); 
    });
    */
    
});
/*
router.get('/register', urlencodedParser, function (req, res, next) {
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    const random = (length = 8) => {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    };
    let rand = random()
    let myCollection = db.collection('users')
    let user = {
        fname:'Didier',
        lname:'Hatto',
        email: rand+'@admin.com', 
        password: rand+'@admin.com',
        level:1,
        params : []
    }
    myCollection.insertOne(user, (err, result) => { 
        res.send(user)
    });

    res.redirect('./')
});
*/
/* Login user */
router.post('/login', urlencodedParser,async function (req, res, next) {
    
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    const email = req.body.email;
    const password = req.body.password;
    let loginResult = null;
    let user =  await db.collection('users').findOne({'email':email})
    if( user != null){
        if(user.password == password){
            loginResult = { result:true, userID : user._id } 
        }else{
            loginResult = { result:false } 
        }
    }else{
        loginResult = {  result:null } 
    }
    if (loginResult.result) {

        let options = {
            //maxAge: 1000 * 60 * 60 * 24, // would expire after 24 hours
            httpOnly: true, // The cookie only accessible by the web server
            signed: true // Indicates if the cookie should be signed
        }
    
        // Set cookie
        res.cookie('isLogin', {statut:true,userID:loginResult.userID}, options) // options is optional  
        res.redirect('../')
    }
    else {
        res.render('login', {title:'堀健データベース',error: true});
    }
});
router.get('/logout', urlencodedParser,async function (req, res, next) {
    
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    cookie = req.signedCookies;
    res.cookie('isLogin', {expires: new Date(0)});
    res.redirect('../')
})

router.post('/register', urlencodedParser, function (req, res, next) {   
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    console.log(req.body)
    let myCollection = db.collection('users')
    myCollection.insertOne(req.body, (err, result) => {
      res.redirect('/dashboard/settings/users')
     });
});
router.post('/edit',urlencodedParser, (req, res) => {  
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    if(req.query.userID){
      console.log(req.query.userID)
      console.log(req.body)
      let myCollection = db.collection('users')
      myCollection.updateOne({ '_id': new ObjectId(req.query.userID) }, { $set: req.body }, (err, result) => { 
        res.redirect('back')
       });
    }else{
      console.log('userID not founded')
      res.redirect('/dashboard/settings/users')
    }

});
router.post('/delete',urlencodedParser, (req, res) => {
    
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    if(req.query.userID){
        console.log(req.query.userID)
        console.log(req.body)
        let myCollection = db.collection('users')
        myCollection.deleteOne({ '_id': new ObjectId(req.query.userID) }, (err, result) => { 
        res.redirect('/dashboard/settings/users')
        });
    }else{
        console.log('userID not founded')
        res.redirect('/dashboard/settings/users')
    }
});

router.get('/info/:userID',urlencodedParser, (req, res) => {

    let userID = req.params.userID; 
    console.log({
        event:'user info',
        userID:userID
    })
    try{
        db.collection('users').findOne({'_id':new ObjectId(userID)}, (err, result) => {
            if(result){
                res.send(result);
            }else{
                res.send(false)
            }
        });
    }catch(err){
        res.send(false)
        console.log(err)
        //console.log('Problem identifying the user')
    }
  
  });
module.exports = router;