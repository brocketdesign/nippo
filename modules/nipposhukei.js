const moment = require('moment');
const ObjectId = require('mongodb').ObjectId;

async function nipposhukei(db){
    const globalsetting = await db.collection('globalsetting').findOne({})
    var date = new Date();
    var today = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }
    const todayJP = date.toLocaleDateString('ja-JP', options)
    let isUpToDate = await new Promise((resolve,reject)=>{
        db.collection('shukei').findOne({'today':today}, (err, result) => {
            if(result){
                resolve(true)
            }else{
                resolve(false)
            }
        })
    })

    //Period List
    let periodList = {}
    let shimebi = parseInt(globalsetting.period)
    let dd = moment()
    let c_period_end = moment({y:dd.year(),M:dd.month(),d:shimebi})
    let c_period_start = moment({y:dd.year(),M:dd.month(),d:shimebi}).subtract(1,'month').add(1,'day')
    if(dd.date()>shimebi){
        c_period_end = moment({y:dd.year(),M:dd.month(),d:shimebi}).add(1,'month')
        c_period_start = moment({y:dd.year(),M:dd.month(),d:shimebi}).add(1,'day')
    }
    periodList[0]={
        m_start:c_period_start,
        m_end:c_period_end,
        start:c_period_start.format(),
        end:c_period_end.format()
    }
    for(let i=1;i<=10;i++){
        dd = periodList[(i-1)].m_start
        m_end = moment({y:dd.year(),M:dd.month(),d:shimebi})
        m_start = moment({y:dd.year(),M:dd.month(),d:shimebi}).subtract(1,'month').add(1,'day')
        periodList[i]={
            m_start:m_start,
            m_end:m_end,
            start:m_start.format(),
            end:m_end.format()
        }
    }
    db.collection('globalsetting').updateOne({'_id':new ObjectId(globalsetting._id)}, { $set: { preiodList: periodList } }, (err, result) => { });

    console.log({
        event:'/nippo/shukei',
        todayJP:todayJP,
        isUpToDate:isUpToDate,
    })
    if(!isUpToDate){
        console.log({
            event:'nipposhukei',
            stat:'START'
        })
        let result = []
        let myCollection = db.collection('users')

        let usersID = await myCollection.find().toArray();
        let usersInfo = [] //NON ADMIN USER
        usersID.forEach(user => {
            if(parseInt(user.level) != 1){
                usersInfo.push(user)
            }
        })
        let data = []
        let genbasShukei = {}
        for(let i=0;i<usersInfo.length;i++){
            let user = usersInfo[i]
            let userID = user._id
            genbasShukei[userID] = {lname : user.lname, fname : user.fname,info:{}}
            data = data.concat(await db.collection(userID+'_nippo').find().sort({'_id':-1}).toArray())
        };
        let shukei = {}
        data.forEach(element => {
            Object.keys(element).forEach(item => {
                if(item.indexOf('工事名')>=0){
                    let st = element['日-'+item.substring(item.indexOf('-')+1)]
                    let pt = element.userID
                    let uname = genbasShukei[pt].lname+' '+genbasShukei[pt].fname;

                    if(st != undefined ){
                        if(shukei[element[item]] == undefined){
                        shukei[element[item]] = {'作業者':[],'作業時間':0,detail:{}}
                        }
                        if(!shukei[element[item]].作業者.includes(uname)){
                        shukei[element[item]].作業者.push(uname)
                        }
                        shukei[element[item]].作業時間 += parseFloat(st)

                        if(genbasShukei[pt].info[element[item]] == undefined){
                        genbasShukei[pt].info[element[item]] = 0
                        shukei[element[item]].detail[uname] = 0
                        }
                        genbasShukei[pt].info[element[item]] += parseFloat(st)
                        shukei[element[item]].detail[uname] += parseFloat(st)
                    }
                }
            });
        });
        /*
        let companies = await db.collection('company').find().toArray();
        companies.forEach((element,index) => {
            companies[index]=element.el
        });
        */
        let genbas = await db.collection('genba').find().toArray();
        genbas.forEach((element,index) => {
            genbas[index]={
                id:element._id,
                name:element['工事名']
            }
        });
        //Company Shukei 3 periods
        let period_start = []
        let period_end = []
        for(let i=0;i<=2;i++){
            period_start.push(globalsetting.preiodList[i].start)
            period_end.push(globalsetting.preiodList[i].end)
        }
        let companyShukei = await companyShukeiDo(period_start,period_end,db)
        async function companyShukeiDo(period_start,period_end,db){
            return await new Promise(async(resolve,reject)=>{
                let companyShukei = {}
                for(let i=0;i<genbas.length;i++){
                    let genbaNippo = await db.collection(genbas[i].id+'_genbanippo').find().toArray();
                    //業社名
                    for(let j=0;j<genbaNippo.length;j++){
                        let element = genbaNippo[j]
                        if(([genbas[i].name]!=undefined)&&([genbas[i].name]!='')){
                            for(let l=0;l<period_start.length;l++){
                                if(( new Date(element.日付) >= new Date(period_start[l])) && (new Date(element.日付) <= new Date(period_end[l]))){
                                    for(let k=0;k<=parseInt(element.totalLine);k++){
                                        try{
                                            if(companyShukei[l]==undefined){
                                                companyShukei[l] = {}
                                            }
                                            if((element['業社名-'+k]!=undefined)&&(element['業社名-'+k]!='')){
                                                if(companyShukei[l][element['業社名-'+k]]==undefined){
                                                    companyShukei[l][element['業社名-'+k]] = {'合計人員':0,'data':{}}
                                                }
                                                if(companyShukei[l][element['業社名-'+k]]['data'][genbas[i].name]==undefined){
                                                    companyShukei[l][element['業社名-'+k]]['data'][genbas[i].name] = {'合計人員':0,'data':[]}
                                                }
                                                let obj = {'userName':'','genbaID':'','todayJP':'','工種':'','業社名':'','人員':0,'作業内容':''}
                                                element['人員-'+k]=tr(element['人員-'+k], "０１２３４５６７８９　", "0123456789 ");
                                                if((isNaN(element['人員-'+k])==true)||(element['人員-'+k]=='')){
                                                    element['人員-'+k]=0
                                                }
                                                obj['userName'] = element['userName']
                                                obj['genbaID'] = element['genbaID']
                                                obj['todayJP'] = element['todayJP']
                                                obj['工種'] = element['工種-'+k]
                                                obj['業社名'] = element['業社名-'+k]
                                                obj['作業内容'] = element['作業内容-'+k]
                                                obj['人員'] = parseFloat(element['人員-'+k])
                                                companyShukei[l][element['業社名-'+k]]['data'][genbas[i].name]['data'].push(obj)
                                                companyShukei[l][element['業社名-'+k]]['data'][genbas[i].name]['合計人員'] += parseFloat(element['人員-'+k])
                                                companyShukei[l][element['業社名-'+k]]['合計人員'] += parseFloat(element['人員-'+k])
                                            }
                                        }catch(e){console.log(e)}
                                    }
                                }
                            }
                        }
                    }
                }
                resolve(companyShukei)
            })

        }

        let sompanyShukeiCSV = []

        let shukeiCSV = []
        Object.keys(shukei).forEach(shukeiGenba => {
            let obj = {}
            obj.現場 = shukeiGenba
            obj.合計時間 = shukei[shukeiGenba].作業時間
            obj.作業者名 = shukei[shukeiGenba].作業者
            shukeiCSV.push(obj)
        });
        let genbasCSV = []
        Object.keys(genbasShukei).forEach(userID => {
            Object.keys(genbasShukei[userID].info).forEach(genba => {
            let obj = {}
            obj.userID = userID
            obj.作業者名 = genbasShukei[userID].lname+' '+genbasShukei[userID].fname
            obj.現場 = genba
            obj.合計時間 = genbasShukei[userID].info[genba]
            delete obj.usersID
            genbasCSV.push(obj)
            });
        });

        shukei.date=date
        shukei.today=today
        shukei.todayJP=todayJP
        db.collection('shukei').deleteMany({})
        db.collection('shukei').insertOne(shukei, (err, result) => { });
        genbasShukei.date=date
        genbasShukei.today=today
        genbasShukei.todayJP=todayJP
        db.collection('genbasShukei').deleteMany({})
        db.collection('genbasShukei').insertOne(genbasShukei, (err, result) => { });
        companyShukei.date=date
        companyShukei.today=today
        companyShukei.todayJP=todayJP
        db.collection('companyShukei').deleteMany({})
        db.collection('companyShukei').insertOne(companyShukei, (err, result) => { });

        db.collection('shukeiCSV').deleteMany({})
        db.collection('shukeiCSV').insertOne({date:date,today:today,data:shukeiCSV}, (err, result) => { });

        db.collection('genbasCSV').deleteMany({})
        db.collection('genbasCSV').insertOne({date:date,today:today,data:genbasCSV}, (err, result) => { });

        console.log({
            event:'nipposhukei',
            stat:'END'
        })
    }

}
function tr( text, search, replace ) {
    // Make the search string a regex.
    var regex = RegExp( '[' + search + ']', 'g' );
    var t = text.replace( regex,
            function( chr ) {
                // Get the position of the found character in the search string.
                var ind = search.indexOf( chr );
                // Get the corresponding character from the replace string.
                var r = replace.charAt( ind );
                return r;
            } );
    return t;
}
module.exports=nipposhukei
