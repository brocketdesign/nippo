const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
router.use(cookieParser('twa'));
require('dotenv').config({ path: './.env' });
let nodemailer = require('nodemailer');
const currVersion = '8.0'

var db;
MongoClient.connect(process.env.MONGODB_URL)
.then(client =>{
    db = client.db('horiken');
})
.catch((e)=>{
    console.log(e)
    console.log('DB connection error !')
})
let transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_SMTP_HOST, 
    port: process.env.EMAIL_SMTP_PORT,
    secure: process.env.EMAIL_SMTP_SECURE,
    auth: {
        user: process.env.EMAIL_SMTP_USERNAME,
        pass: process.env.EMAIL_SMTP_PASSWORD 
    },
});

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
router.post('/edit',urlencodedParser, async (req, res) => {  
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    if(req.query.userID){
      let update = req.body
      update.genba = await handleGenbaIds(update.genba)
      let myCollection = db.collection('users')
      myCollection.updateOne({ '_id': new ObjectId(req.query.userID) }, { $set: update }, (err, result) => { 
        res.redirect('back')
       });
    }else{
      console.log('userID not founded')
      res.redirect('/dashboard/settings/users')
    }

});

async function handleGenbaIds(genbaIds) {
    try {
        // If genbaIds is a single string, convert it to an array
        if (typeof genbaIds === 'string') {
            genbaIds = [genbaIds];
        }

        // Filter out any empty genbaId values
        const validGenbaIds = genbaIds.filter(genbaId => genbaId.trim() !== "");

        // Map over each valid genbaId
        const genbaObjects = await Promise.all(validGenbaIds.map(async (genbaId) => {
            // Fetch the name for the current genbaId
            const name = await getGenbaName(genbaId);
            
            // Return an object with id and name fields
            return {
                id: genbaId,
                name: name
            };
        }));

        return genbaObjects;
    } catch (error) {
        console.error("Error in handleGenbaIds:", error);
        throw error;  // or handle the error in some other appropriate way
    }
}


// Example function to fetch the genba name for a given ID from the database
async function getGenbaName(genbaId) {
    const genbaDocument = await db.collection('genba').findOne({ _id: new ObjectId(genbaId) });
    return genbaDocument ? genbaDocument.工事名 : null;  // Assuming each genba document has a name field
}

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
        console.log('Problem identifying the user')
    }
  
});
router.post('/forgot-password', urlencodedParser,async function (req, res, next) {
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    const email = req.body.email;

    let user =  await db.collection('users').findOne({'email':email});
    if( user != null){
        const verification_key = generateVerificationKey();
        db.collection('users').updateOne({ '_id': new ObjectId(user._id) }, { $set: {verification_key} }, (err, result) => { 
            const html = `
            <div>
                堀健データベースをご利用いただきありがとうございます。<br/>
                このメールは、パスワードリセットの手続きをされた方に送信しています。<br/>
                このメールに心当たりがない場合（パスワードリセットの申請に心当たりがない場合）、何も行わずにこのメールを破棄してください。<br/>
                堀健データベース上で下記の確認コードと新しいパスワードを入力いただき、パスワードリセットの手続きを完了してください。<br/>
                確認コード：${verification_key}
            </div>
            `;
            const mailOptions = {
                from :  `noreply@horiken.com`,
                to : email,
                subject: "パスワードリセット手続きのお知らせ",
                html: html
            }
            transporter.sendMail(mailOptions, (err, data) => {
                if(err){
                    res.render('forgot_password', {title:'堀健データベース',errorSendEmail: true, version:currVersion});
                    console.log(err)
                } else {
                    res.cookie('email_for_verification', {email});
                    res.redirect('../reset-password');
                }
            })
        });
    } else {
        res.render('forgot_password', {title:'堀健データベース',error: true,  version:currVersion});
    }
});
router.post('/reset-password',urlencodedParser, async (req, res) => {
    if (req.cookies.email_for_verification) {
        const email = req.cookies.email_for_verification.email;
        const password = req.body.new_password;
        const password2 = req.body.new_password2;
        let user =  await db.collection('users').findOne({'email':email});
        if( user != null){
            if(password == password2){
                if (user.verification_key !=req.body.verifiction) {
                    res.render('reset_password', {title:'新しいパスワードの設定', version:currVersion, email:email, error_invalid_verification_key:true});
                } else {
                    const verification_key = generateVerificationKey();
                    db.collection('users').updateOne({ '_id': new ObjectId(user._id) }, { $set: {password, verification_key} }, (err, result) => {
                        res.render('reset_password', {title:'新しいパスワードの設定', success: true, version:currVersion});
                    });
                }
            } else {
                res.render('reset_password', {title:'新しいパスワードの設定', version:currVersion, email:email, error_not_same:true});
            }
        }else{
            res.redirect('../dashboard');
        }
    } else {
        res.redirect('../dashboard');
    }
});
function generateVerificationKey() {
    const keyLength = 5;
    let verificationKey = '';
  
    for (let i = 0; i < keyLength; i++) {
      verificationKey += Math.floor(Math.random() * 10);
    }
  
    return verificationKey;
  }
transporter.verify(function(error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Server is ready to take our messages!");
    }
});
module.exports = router;