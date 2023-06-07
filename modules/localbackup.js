const fs = require('fs');
const archiver = require('archiver');
const del = require('del');
const d = new Date().toLocaleDateString('ja-JP').replace(/\//g,'-');
async function localbackup(db,filename){
    let dir = './backup/'+filename+'-'+d
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log("Directory is created.");
            let result = []
            let collections = await db.listCollections().toArray()
            for(let i=0;i<collections.length;i++){
                let element = collections[i]
                await new Promise((resolve,reject)=>{
                    if(element!=undefined){
                        db.collection(element.name).find().toArray(async(err, results) => { 
                            let data = JSON.stringify(results);
                            await writefile(element.name,data,dir)
                            resolve()
                        });
                    }else{
                        resolve()
                    }
                })
                console.log((i+1)+'/'+collections.length)
            }
            await archivedirectory(dir)
            try {
                await del(dir);
                console.log(`${dir} is deleted!`);
            } catch (err) {
                console.error(`Error while deleting ${dir}.`);
            }
        } else {
            await archivedirectory(dir)
            console.log("Directory already exists.");
        }
    } catch (err) {
        console.log(err);
    }    
}

async function writefile(name,data,dir){
    await fs.writeFile(dir+'/'+name+'.json', data, 'utf8', (err) => {
        if (err) {
            console.log(`Error writing file: ${err}`);
        } else {
            //console.log(`File is written successfully!`);
        }   
    });
}
async function archivedirectory(dir){
    const output = fs.createWriteStream(dir + '.zip');
    const archive = archiver('zip');
    archive.on('error', function(err) {
        throw err;
    });
    await archive.pipe(output);
    await archive.directory(dir, false);
    await archive.finalize();
}
module.exports=localbackup