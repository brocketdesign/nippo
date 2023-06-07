
  const writefile = require('../modules/writefile')
  //61033e07166b630e7dceb85e DEV
  let result = []
  let collections = await db.listCollections().toArray()
  for(let i=0;i<collections.length;i++){
    let element = collections[i]
    if(element!=undefined){
      /*
      db.collection(element.name).find().toArray((err, results) => { 
        let data = JSON.stringify(results);
        writefile(element.name,data)
      });
      */
      if(element.name.indexOf('_genbanippo')>=0){
        result.push(element.name)
      }
    }
  }
  let obj = {}
  for(let i=0;i<result.length;i++){
    let collection = result[i]
    let info = await db.collection(collection).find().sort({'_id':-1}).limit(1).toArray();
    try{
      if(obj[info[0].genbaName]!=undefined){
        obj[info[0].genbaName].collection.push(collection)
      }else{
        obj[info[0].genbaName]={collection:[collection]}
      }
    }catch{}
    console.log((i+1)+'/'+result.length)
  }
  for(let i=0;i<Object.keys(obj).length;i++){
    let genbaname = Object.keys(obj)[i]
    let verified_id = await db.collection('genba').findOne({'工事名':genbaname})
    try{
      obj[genbaname].verified_id=verified_id._id
    }catch{}
    console.log((i+1)+'/'+Object.keys(obj).length)
  }

  result=obj
  db.collection('debug').insertOne(result, (err, result) => { });