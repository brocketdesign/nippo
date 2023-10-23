const cron = require('node-cron');
const nipposhukei = require('../modules/nipposhukei');
const { ObjectId } = require('mongodb');

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
async function manageListKoushu(db){
   //findGenbaList(db).catch(console.error);
}

async function findGenbaList(db) {
  // Get all company and genba info
  const companyInfo = await db.collection('company').find().toArray();
  const genbaList10 = await db.collection('genba').find().toArray();

  // Create a map to store genbaList for each company
  const companyGenbaMap = new Map();

  // Fetch genbaNippo data for each genba and process
  const genbaNippoPromises = genbaList10.map(async (genba) => {
    const nippoCollection = db.collection(`${genba._id}_genbanippo`);
    const genbaNippoList = await nippoCollection.find().toArray();
    
    for (const genbaNippo of genbaNippoList) {
      if (genbaNippo.totalLine) {
        for (let i = 1; i <= parseInt(genbaNippo.totalLine); i++) {
          const companyName = genbaNippo[`業社名-${i}`];
          const company = companyInfo.find(c => c.el === companyName);
          
          // If company exists, update its genbaList
          if (company) {
            if (!companyGenbaMap.has(company._id)) {
              companyGenbaMap.set(company._id, []);
            }
            companyGenbaMap.get(company._id).push(genba._id);
          }
        }
      }
    }
  });

  await Promise.all(genbaNippoPromises);

  // Update companyInfo with genbaList
  for (const company of companyInfo) {
    const genbaList = companyGenbaMap.get(company._id) || [];
    company.genbaList = Array.from(new Set(genbaList)); // Remove duplicates

    // Update the company in the database
    await db.collection('company').updateOne(
      { _id: new ObjectId(company._id) }, 
      { $set: { genbaList: company.genbaList } }
    );

    console.log(`Updated company ${company._id} with genbaList: ${company.genbaList}`);
  }
}

async function companyManage(db) {
  const companies = await db.collection('company').find().toArray();
  const koushu = await db.collection('koushu').find().toArray();

  // Convert koushu to a mapping of id to name and name to id for faster lookup
  const idToNameMap = {};
  const nameToIdMap = {};
  for (const k of koushu) {
      idToNameMap[k._id.toString()] = k.el;
      nameToIdMap[k.el] = k._id;
  }

  for (const company of companies) {
      const updatedSub = [];

      for (const entry of company.sub) {
          if (idToNameMap[entry]) {
              // If the entry is an ObjectId (i.e., it exists in the idToNameMap)
              updatedSub.push({
                  id: entry,
                  name: idToNameMap[entry]
              });
          } else if (nameToIdMap[entry]) {
              // If the entry is a name (i.e., it exists in the nameToIdMap)
              updatedSub.push({
                  id: nameToIdMap[entry].toString(),
                  name: entry
              });
          }
      }

      // Update the company's sub field in the database
      await db.collection('company').updateOne(
          { _id: company._id },
          { $set: { sub: updatedSub } }
      );
  }
}

module.exports=cronjob