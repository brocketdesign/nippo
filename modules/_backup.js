spawn = require('child_process').spawn
async function backup(filename){
    return new Promise((resolve,reject)=>{
        let d = new Date().toLocaleDateString('ja-JP').replace(/\//g,'-');
        let backupProcess = spawn('mongodump', [
            '--db=horiken',
            '--gzip',
            '--archive=./backup/'+filename+'-'+d+'.gzip',
            ]);
        
        backupProcess.on('exit', (code, signal) => {
            if(code){
                console.log('Backup process exited with code ', code);
                reject();
            }else{
                if (signal){
                    console.error('Backup process was killed with singal ', signal);
                    reject();
                } else {
                    console.log('Successfully backedup the database');
                    resolve();
                } 
            }
            console.log(d)
        });
    })
}

module.exports=backup