const ObjectId = require('mongodb').ObjectId;

async function userData(req){
    const db = req.app.locals.db;
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    let p1 = new Promise(async(resolve,reject)=>{
      let res={}
      let isLogin = req.signedCookies.isLogin
      if( isLogin != undefined){
          let userID = isLogin.userID
          if( isLogin.statut == true ){
              res = await new Promise((resolve,reject)=>{
                  let myCollection = db.collection('users')
                  myCollection.findOne({'_id':new ObjectId(userID)},(err, user) => { 
                    let obj = user
                    if(user.level != 1){
                      obj.isAdmin=false; 
                    }else{
                      obj.isAdmin=true;
                    }
                    obj.name = user.lname +' '+ user.fname
                    resolve(obj)
                  });
              })
              res.userID=userID
              res.isLogin=true
          }else{
              res.isLogin=false
          }
      }else{
          res.isLogin=false
      }
      resolve(res)
    })
    let p2 = new Promise(async(resolve,reject)=>{
        let settings = await db.collection('globalsetting').find().toArray()
        resolve(settings[0])
    })
    let result = await Promise.all([p1,p2])
    result = Object.assign(result[0],result[1])
    result.date=date
    result.today=today
    
    return result
}
module.exports=userData