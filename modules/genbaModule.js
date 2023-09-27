const moment = require('moment');
const genbatoday = require('./genbatoday');


exports.getGenbaToday = async (db, userID, ct, weekspan) => {
  // Wrap the query inside a Promise to handle async operations
  return new Promise((resolve, reject) => {
    // Query the genbatoday collection
    db.collection('genbatoday').find({ userID , today: { $in: weekspan } }).toArray(async (err, results) => {
      if (err) {
        // Log and reject the promise if an error occurs
        console.log("Error querying genbatoday:", err);
        return reject(err);
      }
      
      // Initialize an array to hold the results
      let isGenba = [];
      let tt = [];

      // Process the query results
      if (results.length > 0) {
        //console.log(`Found ${results.length} results for userID: ${userID} on dates: ${weekspan.join(', ')}`);
        for (let i = 0; i < results.length; i++) {
          let element = results[i];
          let genbaID = element.genbaID;
          let genbaName = element.genbaName;
          if (!tt.includes(genbaID)) {
            isGenba.push({ genbaID: genbaID, genbaName: genbaName });
            tt.push(genbaID);
          }
        }
      } else {
        //console.log(`No results found for userID: ${userID} on dates: ${weekspan.join(', ')}`);
      }
      // Resolve the promise with the processed results
      resolve(isGenba);
    });
  });
};

exports.getGenbaOtherDays = async (db, userID, ct) => {
  // Wrap the query inside a Promise to handle async operations
  return new Promise(async (resolve, reject) => {
    // Query the genba collection to get all genba records
    let genbas = await db.collection('genba').find().toArray();
    let isGenba = [];
    let tt = [];
    let count = 0;

    //console.log(`Found ${genbas.length} genba records.`);

    // Iterate through each genba to find relevant records for the user
    for (let i = 0; i < genbas.length; i++) {
      let genba = genbas[i];
      await db.collection(genba._id + '_genbanippo').findOne({ userID , today: ct }, (err, value) => {
        if (err) {
          // Log and reject the promise if an error occurs
          console.log("Error querying genbanippo:", err);
          return reject(err);
        }

        // Process the found record
        if (value) {
          //console.log(`Found record for genbaID: ${value.genbaID} on date: ${ct}`);
          if (!tt.includes(value.genbaID)) {
            if (parseInt(value.totalLine) > 0) {
              isGenba.push({ genbaID: value.genbaID, genbaName: value.genbaName });
            }
            tt.push(value.genbaID);
          }
        }
        count++;
        
        // If we've checked all genbas, resolve the promise
        if (count >= genbas.length) {
          resolve(isGenba);
        }
      });
    }
  });
};
