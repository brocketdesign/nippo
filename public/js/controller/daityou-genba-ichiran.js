$(document).ready(async function () {

  let genbaID = getUrlParameter('genbaID')
  let genbaName = getUrlParameter('genbaName')
  let includeTax = getUrlParameter('includeTax')
  // let genbaID = "610c7d73c3640304088b6735"

  if (!!document.querySelector('#daityouGenbaIchiran')) {
    initNavBar()
    genbaIchiranInit(today)
  }

  function initNavBar() {
    $('#title').html(genbaName)
    var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName + '&includeTax=' + includeTax
    $('#nav-genba').attr('href', '/dashboard/daityou/genba?' + urlParams)
    $('#nav-sihara').attr('href', '/dashboard/daityou/sihara_ichiran?' + urlParams)
    // $('#nav-ichiran').attr('href', '/dashboard/daityou/genba_ichiran?' + urlParams)
    $('#nav-yosan').attr('href', '/dashboard/daityou/yosan?' + urlParams)
  }

  async function genbaIchiranInit(today, start, end) {
    start = start || false; end = end || false
    if ((!start) && (!end)) {
        let period = await $.get('/api/globalsetting')
        start = period[0].period_start
        end = period[0].period_end
    }
    // let genbaID =  $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('data-id')
    // let genbaName = $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('value')
    // if (false) {
    //     console.log({
    //         event: 'genbaIchiranInit',
    //         genbaID: genbaID,
    //         genbaName: genbaName,
    //         today: today,
    //         start: start,
    //         end: end,
    //     })
    // }
    if (genbaID != undefined) {
        $('.alert-genba').hide()
        $('#genbaichiran .ichiran tbody').html('')
        $('#genbaichiran ul.ichiran').html('')
        $('#info.genba').html('')
        if (!$('#noResult').hasClass('d-none')) {
            $('#noResult').addClass('d-none')
        }
        if ($('#genbaichiran .loading').hasClass('d-none')) {
            $('#genbaichiran .loading').removeClass('d-none')
        }
        if (!$('.info.savingPointer').is(':visible')) {
            $('.info.savingPointer').show()
        }

        $.get('/api/genbaichiran?genbaID='+genbaID+'&today='+today+'&start='+start+'&end='+end, async function(result){
            if (result) {
                $('#genbaichiran .ichiran thead tr').html('')
                $('#genbaichiran').show()
                //SET HEADINGS TABLE
                $('#genbaichiran .ichiran thead tr').prepend('<th scope="col" class="pl-2 py-2" style="cursor:pointer" onclick="sortTableByDate(\'genbaIchiran\', 0, \'genba-arrow-up\', \'genba-arrow-down\')">日付<i id="genba-arrow-up" style="width: 20px; height: 20px; margin-left: 5px;display:none;" data-feather="arrow-up"></i><i id="genba-arrow-down" style="width: 20px; height: 20px; margin-left: 5px;" data-feather="arrow-down"></i></th><th scope="col" class="pl-2 py-2">工種</th><th scope="col" class="pl-2 py-2">業社名</th><th scope="col" class="pl-2 py-2">人員</th><th scope="col" class="pl-2 py-2">作業内容</th><th scope="col" class="pl-2 py-2">入力者名</th><th scope="col" class="d-none pl-2 py-2"></th>')
                //SHUKEI INFO
                $('.card.info').show()
                $('.nice-select.input-genba.globalselector').addClass('disabled')
                $('select.input-genba.globalselector').prop('disabled', true)
                $('#info.genba').html('')

                let info = { event: 'genba-shukei', 工種合計: 0 }
                let companyList = await $.get( "/api/company")
                result.forEach(data => {
                    let res_content = ''
                    for (let n = 1; n <= data.totalLine; n++) {
                        if (data) {
                            let col1 = data['工種-' + n] || '-'
                            let company = companyList.filter(company => company._id === data['業社ID-'+n]);
                            if (company.length == 0) break;
                            let col2 = company[0].el || '-'
                            let col3 = data['人員-' + n] || '-'
                            let col4 = data['作業内容-' + n] || '-'
                            if (!$.isNumeric(col3)) {
                                col3 = 0
                            }
                            if (col1 != '-') {
                                if (!info[col1]) {
                                    info[col1] = { total: parseFloat(col3), detail: {} }
                                } else {
                                    info[col1].total += parseFloat(col3)
                                }
                                if (!info[col1].detail[col2]) {
                                    info[col1].detail[col2] = parseFloat(col3)
                                } else {
                                    info[col1].detail[col2] += parseFloat(col3)
                                }
                            }
                            info.工種合計 += parseFloat(col3)

                            let content = ''
                            let list_content_item = ''
                            if (!((col1 == '-') && (col2 == '-') && ((col3 == '-') || (col3 == 0)) && (col4 == '-'))) {
                                if (!document.querySelector('#genbaichiran .list-group-item[data-value="' + data['todayJP'] + '"]')) {
                                    let header_content = ''
                                    header_content += '<li class="list-group-item bg-transparent border-0 p-0 mb-2" data-id="' + data._id + '" data-value="' + data['todayJP'] + '">'
                                    header_content += '<div class="col-12 rounded-0 p-3 isweekend-' + data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(', '').replace(')', '') + '" style="font-size: 31px;">' + data['todayJP'] + '</div>'                            //content += '<td><select style="display:none" data-type="input-koushu" data-field="工種-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-koushu px-2 bg-white border border-secondary rounded" placeholder="'+col1+'" value="'+col1+'" name="工種-'+n+'" onchange="updateField(this)"></select></td>'
                                    header_content += '</li>'
                                    $('#genbaichiran ul.ichiran').append(header_content)
                                }
                                content += '<tr data-id="' + data._id + '" data-value="' + n + '" class="ms-genbanippo removeThisIdHide">'
                                list_content_item += '<div class="list_container ms-genbanippo row px-3 py-2 border rounded-0 m-0 bg-white w-100" data-id="' + data._id + '" data-value="' + n + '">'

                                content += '<td><span class="pl-2 py-3 isweekend-'+data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(','').replace(')','')+'" style="width:auto;display:inline-block" data-name="todayJP" data-value="'+westernDate(data['date'])+'">'+westernDate(data['date'])+'</span></td>'
                                //content += '<td><select style="display:none" data-type="input-koushu" data-field="工種-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-koushu px-2 bg-white border border-secondary rounded" placeholder="'+col1+'" value="'+col1+'" name="工種-'+n+'" onchange="updateField(this)"></select></td>'
                                list_content_item += '<div class="col" data-type="input-koushu" data-field="工種-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '" >' + col1 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-koushu" data-field="工種-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col1 + '</span></td>'
                                //content += '<td><select style="display:none" data-type="input-company" data-field="業社名-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-company px-2 bg-white border border-secondary rounded" placeholder="'+col2+'" value="'+col2+'" name="業社名-'+n+'" onchange="updateField(this)"></select></td>'
                                list_content_item += '<div class="col" data-type="input-company" data-field="業社名-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col2 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-company" data-field="業社名-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col2 + '</span></td>'
                                //content += '<td><input data-type="input-personal" data-field="人員-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-personal decimal px-2 py-2 bg-white border border-secondary rounded" type="text" placeholder="'+col3+'" value="'+col3+'" name="人員-'+n+'" onkeyup="updateField(this)" onclick="updateField(this)"/></td>'
                                list_content_item += '<div class="col" data-type="input-personal" data-field="人員-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col3 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-personal" data-field="人員-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col3 + '</span></td>'
                                //content += '<td><input data-type="input-subject" data-field="作業内容-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-subject px-2 py-2 bg-white border border-secondary rounded" type="text" placeholder="'+col4+'" value="'+col4+'" name="作業内容-'+n+'" onkeyup="updateField(this)" onclick="updateField(this)"/></td>'
                                list_content_item += '<div class="col" data-name="userName" data-id="' + data.userID + '">' + data.userName + '</div>'
                                list_content_item += '<div class="col-12 py-2" data-type="input-subject" data-field="作業内容-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col4 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-subject" data-field="作業内容-' + n + '" data-name="' + genbaID + '_genbanippo" data-id="' + data._id + '" data-userid="' + data.userID + '">' + col4 + '</span></td>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-name="userName" data-id="' + data.userID + '">' + data.userName + '</span></td>'
                                //content += '<td class="text-center edit-options" style="cursor:pointer"><span data-feather="lock" class="locked mx-5" data-id="'+data._id+'" data-value="'+n+'" style="width:15px;height:15px;display:none;"></span><span data-feather="edit" data-id="'+data._id+'" data-value="'+n+'" data-name="'+genbaID+'_genbanippo"  class="editThisId mr-5 d-none" style="width:15px;height: 15px;"></span><span data-feather="trash" data-id="'+data._id+'" data-value="'+n+'" data-name="'+genbaID+'_genbanippo"  class="removeThisId" style="display:none;width:15px;height: 15px;"></span></td>'
                                content += '</tr>'
                                list_content_item += '</div>'
                                res_content += content
                                $('#genbaichiran ul.ichiran .list-group-item[data-value="' + data['todayJP'] + '"]').append(list_content_item)
                            }

                        }
                    }
                    $('#genbaichiran .ichiran tbody').append(res_content)
                    feather.replace();
                });
                if ($('#genbaichiran .ichiran tbody tr').length == 0) {
                    if ($('#noResult').hasClass('d-none')) {
                        $('#noResult').removeClass('d-none')
                    }
                }
                if (!$('#genbaichiran .loading').hasClass('d-none')) {
                    $('#genbaichiran .loading').addClass('d-none')
                }

                $.get('/api/shukei', async function (data) {
                    // if (data[0].todayJP) {
                    //     let ctodayJP = data[0].todayJP
                    //     data = data[0][genbaName]
                    //     $('.info.savingPointer').hide()
                    //     $('.nice-select.input-genba.globalselector').removeClass('disabled')
                    //     $('select.input-genba.globalselector').prop('disabled', false)
                    //     let dTotal = 0; let dDetail = {}
                    //     if ($.isNumeric(data.作業時間) == true) {
                    //         dTotal = data.作業時間
                    //     }
                    //     if (typeof data.detail === 'object') {
                    //         dDetail = data.detail
                    //     }
                    //     info['現場監督'] = { total: parseFloat(dTotal), detail: dDetail }
                    //     info.工種合計 += parseFloat(dTotal)
                    //     info.工種合計 = info.工種合計.toFixed(2)
                    //     console.log({
                    //         event: 'shukei',
                    //         genbaName: genbaName,
                    //         info: info,
                    //         today: today,
                    //     })
                    //     $('.shukei_todayJP').html(' ' + ctodayJP)
                    //     $('#info.genba').append('<ul class="list-group"><li class="list-group-item ms-design showall" data-ms-base="ms-genbanippo" >工種合計 : ' + info['工種合計'] + '</li></ul>')
                    //     Object.keys(info).forEach(k => {
                    //         if (typeof info[k] === 'object' && info[k] !== null) {

                    //             let content = ''
                    //             content += '<div class="card"><div class="card-header collapsed" id="' + k + '" data-toggle="collapse" data-target="#collapse-' + k + '" aria-expanded="true" aria-controls="collapse-' + k + '" style="cursor:pointer">'
                    //             content += '<h5 class="mb-0 float-left ms-design" data-ms-key="' + k + '" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">'
                    //             content += k + ' : ' + info[k].total
                    //             content += '</h5>'
                    //             content += '<div data-feather="minus" class="float-right off" style="display:inline"></div><div data-feather="plus" class="float-right on" style="display:none"></div>'
                    //             content += '</div>'
                    //             content += '<div id="collapse-' + k + '" class="collapse" aria-labelledby="' + k + '" data-parent="#info">'
                    //             content += '<div class="card-body"><ul class="list-group">'
                    //             Object.keys(info[k].detail).forEach(kk => {
                    //                 content += '<li class="list-group-item ms-design" data-ms-key="' + kk + '" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">' + kk + ' : ' + info[k].detail[kk] + '</li>'
                    //             })
                    //             content += '</ul></div></div></div>'
                    //             $('#info.genba').append(content)
                    //         }
                    //     });
                    let ctodayJP = data[0].todayJP
                    let genbaList = await $.get("/api/genba");
                    let preGenba = genbaList.filter(genba => genba._id === genbaID);
                    let genba = '-';
                    if (preGenba[0]) {
                        genba = preGenba[0].工事名
                    }
                    let genbaData = data[0][genba];  
                    $('.info.savingPointer').hide()
                    $('.nice-select.input-genba.globalselector').removeClass('disabled')
                    $('select.input-genba.globalselector').prop('disabled',false)
                    // Check if genbaData is undefined
                    if (typeof genbaData === "undefined") {
                        console.log('データが見つかりませんでした。');
                    }
                    data = genbaData || {};
                    let dTotal = 0;let dDetail = {}
                    if( data.作業時間 && $.isNumeric(data.作業時間)==true){
                        dTotal=data.作業時間
                    }
                    if(typeof data.detail === 'object'){
                        dDetail=data.detail
                    }
                    info['現場監督'] = {total:parseFloat(dTotal),detail:dDetail}
                    info.工種合計 += parseFloat(dTotal)
                    info.工種合計= info.工種合計.toFixed(2)
                   if (false) {
                     console.log({
                         event:'shukei',
                         genbaName:genbaName,
                         info:info,
                         today:today,
                     })
                   }
                    $('.shukei_todayJP').html(' '+ctodayJP)
                    $('#info.genba').append('<ul class="list-group"><li class="list-group-item ms-design showall" data-ms-base="ms-genbanippo" >工種合計 : '+info['工種合計']+'</li></ul>')
                    Object.keys(info).forEach(k => {
                        if(typeof info[k] === 'object' && info[k] !== null){

                            let content = ''
                            content += '<div class="card"><div class="card-header collapsed" id="'+k+'" data-toggle="collapse" data-target="#collapse-'+k+'" aria-expanded="true" aria-controls="collapse-'+k+'" style="cursor:pointer">'
                            content += '<h5 class="mb-0 float-left ms-design" data-ms-key="'+k+'" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">'
                            content += k+' : '+info[k].total
                            content += '</h5>'
                            content += '<div data-feather="minus" class="float-right off" style="display:inline"></div><div data-feather="plus" class="float-right on" style="display:none"></div>'
                            content += '</div>'
                            content += '<div id="collapse-'+k+'" class="collapse" aria-labelledby="'+k+'" data-parent="#info">'
                            content += '<div class="card-body"><ul class="list-group">'
                            Object.keys(info[k].detail).forEach(kk=>{
                                content += '<li class="list-group-item ms-design" data-ms-key="'+kk+'" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">'+kk+' : '+info[k].detail[kk]+'</li>'
                            })
                            content += '</ul></div></div></div>'
                            $('#info.genba').append(content)
                        }
                    });
                })

            } else {
                if ($('#genbaichiran .ichiran tbody tr').length == 0) {
                    if ($('#noResult').hasClass('d-none')) {
                        $('#noResult').removeClass('d-none')
                    }
                }
                if (!$('#genbaichiran .loading').hasClass('d-none')) {
                    $('#genbaichiran .loading').addClass('d-none')
                }
                //SHUKEI INFO
                $('.info.savingPointer').hide()
                $('.nice-select.input-genba.globalselector').removeClass('disabled')
                $('.card.info').hide()
            }

            //genbaIchiranEdit()
            //adminOnly()
            //inputInit()
            //resizeInput()
        })
    } else {
        $('.alert-genba').show()
        if (!$('#genbaichiran .loading').hasClass('d-none')) {
            $('#genbaichiran .loading').addClass('d-none')
        }
        //SHUKEI INFO
        $('.info.savingPointer').hide()
        $('.nice-select.input-genba.globalselector').removeClass('disabled')
    }

  }

})