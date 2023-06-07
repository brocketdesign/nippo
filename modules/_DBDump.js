const moment = require('moment');
const ObjectId = require('mongodb').ObjectId;
const backup = require('./backup')

async function DBDump(db){
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }
    const todayJP = date.toLocaleDateString('ja-JP', options)
    var mDate = moment(date)
    console.log({
        event:'DBDump',
        todayJP:todayJP,
    })
    //Structure
    let DBDump = {
        'weekly':{
            'latestBackup':false, //date
        },
        'monthly':{
            'latestBackup':false, //date
        },
    }
    //Initialise
    //db.collection('DBDump').deleteMany({})
    let DBDumpID = await new Promise((resolve,reject)=>{
        db.collection('DBDump').find().toArray((err, result) => { 
           if(result.length==0){
            db.collection('DBDump').insertOne(DBDump, (err, result) => {
                resolve(result.insertedId)
             });
           }else{
               resolve(result[0]._id)
           }
        });
    })
    //Check DB
    let isUpToDate = await new Promise((resolve,reject)=>{
        db.collection('DBDump').findOne({'_id':new ObjectId(DBDumpID)}, (err, result) => {
            let res={}
            if(result.weekly.latestBackup){
                if(moment(result.weekly.latestBackup).isBefore(mDate.subtract(7, 'days'))){
                    res.weekly=false
                }else{
                    res.weekly=true
                }
            }else{
                res.weekly=false
            }
            if(result.monthly.latestBackup){
                if(moment(result.monthly.latestBackup).isBefore(mDate.subtract(30, 'days'))){
                    res.monthly=false
                }else{
                    res.monthly=true
                }
            }else{
                res.monthly=false
            }
            resolve(res)
        })
    })
   // console.log(isUpToDate)
    if(!isUpToDate.weekly){
        backup('weekly').then(()=>{
            db.collection('DBDump').updateOne({'_id':new ObjectId(DBDumpID)}, { $set: {'weekly':{'latestBackup':date}} }, (err, result) => { });
        }).catch((e)=>{console.log(e)})
    }
    if(!isUpToDate.monthly){
        backup('monthly').then(()=>{
            db.collection('DBDump').updateOne({'_id':new ObjectId(DBDumpID)}, { $set: {'monthly':{'latestBackup':date}} }, (err, result) => { });
        }).catch((e)=>{console.log(e)})
    }
    /*
    //Do Backup
    if(!isUpToDate.weekly){
        let collections = await new Promise((resolve,reject)=>{
            let res = []
             db.listCollections().toArray((err, result)=>{
                result.forEach(element => {
                   res.push(element.name)
                });
                resolve(res)
             })
        })
        //console.log(collections)
        let backcupElement = {}
        for(let i=0;i<collections.length;i++){
            let name = collections[i]
            console.log(name)
            let collection = await db.collection(name).find().toArray();
            backcupElement[name] = collection
        }
        //console.log(backcupElement)
        //db.collection('DBDump').updateOne({'_id':new ObjectId(DBDumpID)}, { $set:  }, (err, result) => { });
    }
    */
}
module.exports=DBDump