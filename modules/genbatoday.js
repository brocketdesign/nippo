async function genbatoday(value,db){
    let genbatodayCollection = db.collection('genbatoday')
  if(parseInt(value.totalLine)>0){
    genbatodayCollection.findOne({userID: value.userID,genbaID:value.genbaID,today:value.today }, (err, result) => {
      if(!result){
        genbatodayCollection.insertOne(value);
      }
    })
  }else{
    genbatodayCollection.findOne({userID: value.userID,genbaID:value.genbaID,today:value.today }, (err, result) => {
      if(result){
        genbatodayCollection.deleteOne({userID: value.userID,genbaID:value.genbaID,today:value.today });
      }
    })
  }
}
module.exports=genbatoday