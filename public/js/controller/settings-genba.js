$(document).ready(async function () {

    let userID =  $('#userID').attr('data-value')
    let genbaID = getUrlParameter('genbaID')
    
    if (!!document.querySelector('#SettingsGenba')) {
        initInput()
    }

    function initInput() {
        let userID =  $('#userID').attr('data-value')
        if (!!document.querySelector(".table#genba")) {
            SUA({ event: '現場一覧ページ' })
            let genbaSelect = $('.table#genba')
            $.get("/api/genba", function (data) { // api.js : router.get('/:dbName')
                data = sortit(data, '工事名kana')
                for (let index = 0; index < data.length; index++) {
                    let element = data[index]
                    if (element.工事名) {
                        let el = element.工事名 || ""
                        let company = element.発注者 || ""
                        let responsibles = element.担当者
                        let elKana = element.工事名kana || ""

                        var respContent = ""
                        if (responsibles) {
                            if (Array.isArray(responsibles)) {
                                responsibles.forEach(responsible => {
                                    respContent += '<div class="responsible">' + responsible + '</div>'
                                })
                            } else {
                                respContent += '<div class="responsible">' + responsibles + '</div>'
                            }
                        } else {
                            respContent = ""
                        }

                        genbaSelect.find('tbody').append('<tr class="clickable" data-link="/dashboard/settings/genba?genbaID=' + element._id + '"><td>' + el + '</td><td>' + elKana + '</td><td>' + company + '</td><td>' + respContent + '</td></tr>')
                    }
                }
                updateUserInfo()
            })
        }
    }

    function updateUserInfo() {
        if (!!document.querySelector('.responsible')) {
            console.log({
                event: 'updateUserInfo'
            })
            //CONVERT USERID TO USER NAME
            $('body').find('.responsible').each(function () {
                $(this).removeClass('responsible')
                let ids = $(this).text().split(',')
                let $this = $(this)
                var tt = 0
                for (let i = 0; i < ids.length; i++) {
                    setTimeout(() => {
                        let userID = ids[i]
                        let index = i
                        $.get('/users/info/' + userID, function (user) {
                            if (user.lname != undefined) {
                                $this.text('')
                                $this.append(user.lname + ' ' + user.fname)
                                $this.show()
                            }
                        })
                    }, tt);
                    tt += 100
                }
            })
        }
    }
})