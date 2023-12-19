const ObjectId = require('mongodb').ObjectId

async function rouhiOfPeriod(db, params, callback) {

  let genbaID = params.genbaID
  let genbaName = params.genbaName
  let yearMin = params.yearMin
  let monthMin = params.monthMin
  let yearMax = params.yearMax
  let monthMax = params.monthMax
  let dateFrom = new Date(yearMin, monthMin-1)
  dateFrom.setDate(dateFrom.getDate() + 1)
  let dateTo = new Date(yearMax, monthMax)

  console.log(params)

  let userCollection = db.collection('users')
  let users_ = await userCollection.find().toArray()
  let users = [] // NON ADMIN USER
  users_.forEach(user => {
    if (parseInt(user.level) != 1) {
      users.push(user)
    }
  })

  let stSumsByUser = []
  let totalSum = 0
  var stSums = {}

  for (var i = 0; i < users.length; i++) {
    let user = users[i];
    let userID = user._id;
    var match = { $match: { 'date': { $gte: dateFrom, $lte: dateTo} } }
    var project = { $project: {'_id':0, 'userID':0, '日付':0, 'statut':0, 'totalTime':0, 'today':0, 'todayJP':0 } }
    var aggregation = [match, project]
    let nippos = await db.collection(userID + '_nippo').aggregate(aggregation).toArray()
    
    var n = nippos.length
    var stSum = 0
    for (var j = 0; j < n; j++) {
      let nippo = nippos[j]
      // Object.keys(nippo).forEach(key => {
      //   if (key.indexOf('工事名') >= 0) {
      //     var k = key.substring(key.indexOf('-')+1)
      //     var genbaName_ = nippo['工事名-' + k]
      //     if (genbaName_ == genbaName) {
      //       let st = nippo['日-' + k]
      //       if (st != undefined) {
      //         stSum += parseFloat(st)
      //       }
      //     }
      //   }
      // })
      let totalLine = parseInt(nippo['totalLine'])
      for (var k = 1; k <= totalLine; k++) {
        var genbaName_ = nippo['工事名-' + k]
        if (genbaName_ == genbaName) {
          var st = nippo['日-' + k]
          if (st != undefined) {
            st = parseFloat(st)
            var date_ = nippo['date']
            var year = date_.getFullYear()
            var month = date_.getMonth() + 1
            month = ('' + month).padStart(2, '0', month)
            if (!stSums[year + month]) {
              stSums[year + month] = st
            } else {
              stSums[year + month] += st
            }
            stSum += st
          }
        }
      }
    }
    totalSum += stSum
    stSumsByUser.push(
      {
        userID: userID, 
        userName:user.lname + ' ' + user.fname, 
        sum: stSum
      }
    )
  }

  if (callback) {
    callback(null, {rouhis_by_month: stSums, rouhis_by_user:stSumsByUser, total:totalSum})
  }
}

module.exports = {rouhiOfPeriod}