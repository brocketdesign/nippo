const cron = require('node-cron');
const nipposhukei = require('../modules/nipposhukei');

// Schedule the cron job to run every day at midnight in Japan time
async function cronjob(db){
  try{
    //Latest shukei Date

    const mostRecentObject = await db.collection('shukei')
    .find()
    .sort({ today: -1 })
    .limit(1)
    .toArray();
  
  console.log(`Latest shukei ${mostRecentObject[0].today}`);

    cron.schedule('0 0 * * *', () => {
        nipposhukei(db);
      }, {
        timezone: 'Asia/Tokyo' // Set the timezone to Japan
      });

  }catch{}
}

module.exports=cronjob