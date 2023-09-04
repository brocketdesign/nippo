const date = new Date()
let chartIDs = [];
const today = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
let options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
}
const weekDays = [
    ["日", "Sunday"],
    ["月", "Monday"],
    ["火", "Tuesday"],
    ["水", "Wednesday"],
    ["木", "Thursday"],
    ["金", "Friday"],
    ["土", "Saturday"],
];
const todayJP = date.toLocaleDateString('ja-JP', options)

let prevDate = new Date(date);
prevDate.setDate(date.getDate() - 10);
const Before10 = (prevDate.getMonth() + 1) + '/' + prevDate.getDate() + '/' + prevDate.getFullYear();

$(document).ready(async function () {
    feather.replace()
    initGlobalSelector()
    //NEW DASHBOARD PAGE
    if (!!document.querySelector('#new_dashoboard_content')) {
        let userID = $('#userID').attr('data-value')
        let start = $('#start-period').attr('data-value')
        let end = $('#end-period').attr('data-value')

        newDashboardCalendarInit(userID, today, start, end);

        $(document).on('change', '.period-list.globalselector', function () {
            let lastStart = $(".period-list.globalselector option:last").attr('data-value').toString().split(' - ')[0];
            // const originalDateStr = $(".period-list.globalselector").val().toString().split(" - ");
            // parsedDate0 = new Date(Date.parse(originalDateStr[0].replace(/年|月/g, "/").replace(/日/g, "")));
            // parsedDate1 = new Date(Date.parse(originalDateStr[1].replace(/年|月/g, "/").replace(/日/g, "")));
            // let postStart = `${parsedDate0.getMonth() + 1}/${parsedDate0.getDate()}/${parsedDate0.getFullYear()}`;
            // let postEnd = `${parsedDate1.getMonth() + 1}/${parsedDate1.getDate()}/${parsedDate1.getFullYear()}`;
            $('.period-list.globalselector').val($('.period-list.globalselector').find('option:checked').text());
            $('.period-list.globalselector').niceSelect('update')

            let postStart = $('.period-list.globalselector').find('option:checked').attr('data-value').substring(0, $('.period-list.globalselector').find('option:checked').attr('data-value').indexOf(' -'))
            let postEnd = $('.period-list.globalselector').find('option:checked').attr('data-value').substring($('.period-list.globalselector').find('option:checked').attr('data-value').indexOf('- ') + 1)
            if (postStart === start) {
                $(".changePeriod.next").prop("disabled", true)
            } else {
                $(".changePeriod.next").prop("disabled", false)
            }
            if (lastStart === postStart) {
                $(".changePeriod.prev").prop("disabled", true)
            } else {
                $(".changePeriod.prev").prop("disabled", false)
            }
            newDashboardCalendarInit(userID, today, postStart, postEnd);
        })
        $(document).on('click', '.changePeriod', function () {
            if ($(this).hasClass('prev')) {
                $(".period-list.globalselector").val($('.period-list.globalselector').find('option:checked').next().text()).change();
                $(".period-list.globalselector").attr('value', $('.period-list.globalselector').find('option:checked').next().text());
            } else {
                $(".period-list.globalselector").val($('.period-list.globalselector').find('option:checked').prev().text()).change();
                $(".period-list.globalselector").attr('value', $('.period-list.globalselector').find('option:checked').prev().text());
            }
            $('.period-list.globalselector').niceSelect('update')
        });

        let genbaIDs = [];

        $.get("/api/genba", function (data) {
            $.get('/api/users?elID=' + userID, function (result) {
                if (result.genba) {
                    if (!Array.isArray(result.genba)) {
                        result.genba = result.genba.split(' ')
                    }
                    let realGenba = [];
                    result.genba.forEach(function (genba) {
                        if (genba) realGenba.push(genba);
                    })
                    for (let i = 0; i < 3; i++) {
                        if (data.filter(item => item.工事名 === realGenba[i]).length) {
                            genbaIDs.push(data.filter(item => item.工事名 === realGenba[i])[0])
                            newDashboardChartInit(i, data.filter(item => item.工事名 === realGenba[i])[0], Before10, today);
                        }
                    }
                }
            });
        });

        $('.chart-date.start').datepicker({
            language: "ja",
            format: 'yyyy/m/d',
            autoclose: true,
            endDate: new Date(),
            todayHighlight: true,
        }).on('changeDate', function (e) {
            const chartNo = Number($(this).attr("chart-no"));
            let dd = new Date(e.date)
            $('.chart-date.end[chart-no="' + chartNo + '"').datepicker('setStartDate', dd);
            let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
            $('.chart-date.start[chart-no="' + chartNo + '"').attr('data-date', ct)
            newDashboardChartInit(chartNo, genbaIDs[chartNo], ct, $('.chart-date.end').attr('data-date'));

        })
        $('.chart-date.end').datepicker({
            language: "ja",
            format: 'yyyy/m/d',
            autoclose: true,
            todayHighlight: true,
            endDate: new Date(),
            // beforeShowDay: function (date) {
            //     return nippoCalendar(date, nippoichiran)
            // }

        }).on('changeDate', function (e) {
            let dd = new Date(e.date)
            const chartNo = Number($(this).attr("chart-no"));
            $('.chart-date.start[chart-no="' + chartNo + '"').datepicker('setEndDate', dd);
            let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
            $('.chart-date.end[chart-no="' + chartNo + '"').attr('data-date', ct);
            newDashboardChartInit(chartNo, genbaIDs[chartNo], $('.chart-date.start').attr('data-date'), ct);
        })
        const startVal = prevDate.getFullYear() + '/' + (prevDate.getMonth() + 1) + '/' + prevDate.getDate();
        const endVal = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
        let prevDateCt = (prevDate.getMonth() + 1) + '/' + prevDate.getDate() + '/' + prevDate.getFullYear();
        $('.chart-date.start').val(startVal).change();
        $('.chart-date.end').val(endVal).change();
        $('.chart-date.start').attr('data-date', prevDateCt);
        $('.chart-date.end').attr('data-date', today);
        $('.chart-date.start').datepicker('update');
        $('.chart-date.end').datepicker('update');
    }

    //NEW DASHBOARD ADMIN PAGE
    if (!!document.querySelector('#new_dashoboard_content_admin')) {
        let userID = $('#userID').attr('data-value')
        let start = $('#start-period').attr('data-value')
        let end = $('#end-period').attr('data-value')
        let labels = null;
        let dataSets = [];
        const genbaList = await $.get('/api/genbaStatistic?today=' + today + '&start=' + start + '&end=' + end);
        
        for (let i = 0; i < genbaList.length; i++) {
            const res = await processingDataForNewDashboardAdmin(genbaList[i], Before10, today);
            dataSets.push(res.dataset);
            if(!labels) labels = res.labels;
        }
        await drawCalendarTableForNewAdminDashboard(labels, dataSets, Before10, today)
        await drawChartForNewAdminDashboard(labels, dataSets)

        $('.chart-date.start').datepicker({
            language: "ja",
            format: 'yyyy/m/d',
            autoclose: true,
            endDate: new Date(),
            todayHighlight: true,
        }).on('changeDate', async function (e) {
            const chartNo = Number($(this).attr("chart-no"));
            let dd = new Date(e.date);
            if($('.chart-date.end[chart-no="'+chartNo+'"').datepicker('getStartDate') < dd) {
                $('.chart-date.end[chart-no="'+chartNo+'"').datepicker('setStartDate', dd);
            }
            let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
            $('.chart-date.start[chart-no="'+chartNo+'"').attr('data-date', ct);
            const changeDataSet1 = [];
            const genbaList = await $.get('/api/genbaStatistic?today=' + today + '&start=' + ct + '&end=' + $('.chart-date.end').attr('data-date'));
            for (let i = 0; i < genbaList.length; i++) {
                const res = await processingDataForNewDashboardAdmin(genbaList[i], ct, $('.chart-date.end').attr('data-date'));
                changeDataSet1.push(res.dataset);
                labels = res.labels;
            }
            await drawChartForNewAdminDashboard(labels, changeDataSet1);
        })
        $('.chart-date.end').datepicker({
            language: "ja",
            format: 'yyyy/m/d',
            autoclose: true,
            todayHighlight: true,
            endDate: new Date(),
        }).on('changeDate', async function (e) {
            let dd = new Date(e.date);
            const chartNo = Number($(this).attr("chart-no"));
            if($('.chart-date.start[chart-no="'+chartNo+'"').datepicker('getEndDate') > dd) {
                $('.chart-date.start[chart-no="'+chartNo+'"').datepicker('setEndDate', dd);
            }
            let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
            $('.chart-date.end[chart-no="'+chartNo+'"').attr('data-date', ct);
            const changeDataSet2 = [];
            const genbaList = await $.get('/api/genbaStatistic?today=' + today + '&start=' + $('.chart-date.start').attr('data-date') + '&end=' + ct);
            for (let i = 0; i < genbaList.length; i++) {
                const res = await processingDataForNewDashboardAdmin(genbaList[i], $('.chart-date.start').attr('data-date'), ct);
                changeDataSet2.push(res.dataset);
                labels = res.labels;
            }
            await drawChartForNewAdminDashboard(labels, changeDataSet2);
        })
        const startVal = prevDate.getFullYear() + '/' + (prevDate.getMonth() + 1) + '/' + prevDate.getDate();
        const endVal = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
        let prevDateCt = (prevDate.getMonth() + 1) + '/' + prevDate.getDate() + '/' + prevDate.getFullYear();
        $('.chart-date.start').val(startVal).change();
        $('.chart-date.end').val(endVal).change();
        $('.chart-date.start').attr('data-date', prevDateCt);
        $('.chart-date.end').attr('data-date', today);
        $('.chart-date.start').datepicker('update');
        $('.chart-date.end').datepicker('update');
    }

    //NEW HOLIDAY SETTING PAGE
    if (!!document.querySelector('#new_dashoboard_setting_holidays')) {

        let body = document.getElementById("calendar_for_holiday");

        let yearCalendar2018 = document.createElement("div");
        yearCalendar2018.id = "2018";
        yearCalendar2018.classList.add("yearCalendar");
        // body.insertBefore(yearCalendar2018, body.lastElementChild);
        $("#calendar_for_holiday").append(yearCalendar2018)

        // let h1 = document.createElement("h1");
        // h1.innerHTML = "Calendar " + calendarDate.getFullYear();
        // body.lastElementChild.before(h1);

        let months2018 = [
            {
                name: "april",
                index: 4,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "may",
                index: 5,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "june",
                index: 6,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "july",
                index: 7,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "august",
                index: 8,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "september",
                index: 9,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "october",
                index: 10,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "november",
                index: 11,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "december",
                index: 12,
                node: createDiv(),
                calendar: createMonthCalendar
            }
        ];
        let months2019 = [
            {
                name: "january",
                index: 1,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "february",
                index: 2,
                node: createDiv(),
                calendar: createMonthCalendar
            },
            {
                name: "march",
                index: 3,
                node: createDiv(),
                calendar: createMonthCalendar
            },
        ];
        for (let month = 0; month < 9; month++) {
            yearCalendar2018.append(months2018[month].calendar());
        }
        let yearCalendar2019 = yearCalendar2018.cloneNode();
        yearCalendar2019.id = "2019";
        // body.lastElementChild.before(yearCalendar2019);
        $("#calendar_for_holiday").append(yearCalendar2019)
        calendarDate.setFullYear(calendarDate.getFullYear() + 1);
        for (let month = 0; month < 3; month++) {
            yearCalendar2019.append(months2019[month].calendar());
        }
    }

    //LOGIN PAGE
    if (!!document.querySelector('#loginForm')) {
        loginInit()
    }
    //NIPPO FORM PAGE
    if (!!document.querySelector("#formPage")) {
        inputInit()
        genbatoday($('#userID').attr('data-value'), today)
        $('.SelectUserID').attr('data-selectid', $('#userID').attr('data-value'))
        setTimeout(() => {
            nippoFormInit()
        }, 1000);
        SUA({ event: '日報入力ページ' });
    }
    //ICHIRAN PAGE
    if (!!document.querySelector('.period-list') || !!document.querySelector('.ichiranPage')) {
        let userID = $('#userID').attr('data-value')
        inputInit(function () {
            $.get("/api/globalsetting", function (data) {
                shimebi = parseInt(data[0].period)
                displayPeriodList(shimebi)
                if (!!document.querySelector('#nippoichiran.current')) {
                    let selectid = userID
                    if (getUrlParameter('selectid') != undefined) {
                        selectid = getUrlParameter('selectid')
                    }
                    console.log({
                        event: 'nippoIchiranInit -> selectid',
                        selectid: selectid
                    })
                    nippoIchiranInit(selectid, today)
                }
                if (!!document.querySelector('#genbaichiran.current')) {
                    //genbaIchiranInit(today)
                }
            })
        });
        SUA({ event: $('.title').text() })
    }
    //NIPPO SHUKEI
    if (!!document.querySelector('#nipposhukei')) {
        nipposhukeiInit()
    }
    //NIPPO EVERY
    if (!!document.querySelector('#nippoEvery')) {
        nippoEveryInit()
    }
    //GENBA SETING
    if (!!document.querySelector('#SettingsGenba') || !!document.querySelector('#editGenba')) {
        SettingsGenbaInit()
    }
    //COMPANY SETING
    if (!!document.querySelector('#SettingsCompany') || !!document.querySelector('#editCompany')) {
        SettingsCompnayInit()
    }
    if (!!document.querySelector('#SettingsUsers') || !!document.querySelector('#editUsers')) {
        SettingsUsersInit()
        SUA({ event: 'プロファイルページ' })
    }
    if (!!document.querySelector('#SettingsUpdate')) {
        SettingsUpdate()
    }
    //GLOBAL SETTINGS
    if (!!document.querySelector('#SettingsGlobal')) {
        SettingsGlobal()
    }
    //NO AJAX PAGES
    if (
        (!!document.querySelector('#listUsers'))
        || (!!document.querySelector('#SettingsGlobal'))
        || (!!document.querySelector('#SettingsUpdate'))
        || (!!document.querySelector('#new_dashoboard_setting_holidays'))
    ) {
        afterAllisDone()
    }
    //TOOLS
    updateUserInfo();
    adminOnly();
    navigationActive();
    updateDate();
    miniTools();

});
$(document).ajaxStop(function () {
    afterAllisDone()
});
function afterAllisDone() {
    formInitCompany()
    feather.replace();
    //OVERLAY
    setTimeout(() => {
        $('#preloader').fadeOut('slow', function () {
            $('#mainContainer').fadeIn(500)
            $('body').find('select').niceSelect();
        })
    }, 500);
}

//CALENDAR COLORED
function nippoCalendar(date, nippoichiran) {
    //console.log(nippoichiran)
    let isDone = []
    if (nippoichiran != false) {
        nippoichiran.forEach(element => {
            if (element.totalTime != '0') {
                isDone.push(new Date(element.today).toLocaleDateString('ja-JP'))
            }
        });
        let cDate = new Date(date).toLocaleDateString('ja-JP')
        /*
        console.log({
            isDone:isDone,
            cDate:cDate
        })
        */
        if (isDone.includes(cDate) == true) {
            return { classes: 'done' };
        } else {
            return { classes: 'highlight' };
        }
    } else {
        return { classes: 'highlight' };
    }
}
//CONTROLER DATE
function datecontrol() {
    if (!!document.querySelector('.input-date.globalselector')) {
        let isAdmin = false;
        if ($('#user-level').attr('data-value') == '1') {
            isAdmin = true
        }
        let ctoday = $('.input-date.globalselector').attr('data-date')
        let sPeriod = $('#start-period').attr('data-value')
        let ePeriod = $('#end-period').attr('data-value')
        var pDay = moment(ctoday).subtract(1, 'days')._d
        var nDay = moment(ctoday).add(1, 'days')._d
        if (((pDay >= new Date(sPeriod)) && (pDay <= new Date(ePeriod))) || (isAdmin == true)) {
            $('.changeDay.prev').prop('disabled', false)
            $('.changeDay.prev').attr('data-value', pDay.toLocaleDateString('ja-JP'))
        } else {
            $('.changeDay.prev').prop('disabled', true)
        }
        if (((nDay >= new Date(sPeriod)) && (nDay <= new Date(ePeriod)) && (nDay <= new Date())) || ((isAdmin == true) && (nDay <= new Date()))) {
            $('.changeDay.next').prop('disabled', false)
            $('.changeDay.next').attr('data-value', nDay.toLocaleDateString('ja-JP'))
        } else {
            $('.changeDay.next').prop('disabled', true)
        }
        console.log({
            event: 'datecontrol',
            isAdmin: isAdmin,
            ctoday: ctoday,
            today: today,
            sPeriod: sPeriod,
            ePeriod: ePeriod,
            pDay: pDay,
            nDay: nDay,
        })
    }
}
$(document).on('click', '.changeDay', function () {
    let cDate = new Date($(this).attr('data-value'))
    let options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    }
    const ctodayJP = cDate.toLocaleDateString('ja-JP', options)
    let sDate = cDate.toLocaleDateString('ja-JP')
    console.log({
        event: 'changeDay',
        cDate: cDate,
        ctodayJP: ctodayJP
    })
    $('.input-date.globalselector').attr('data-date', sDate)
    $('.input-date.globalselector').val(ctodayJP).change()
    $('.input-date.globalselector').datepicker('update');
    $('.input-date.globalselector').datepicker('setDate', cDate);
    datecontrol()
    SUA({ event: '日報入力ページ', detail: '「日付ボタン」をクリックして' + $(this).attr('data-value') + 'の日報へ' })
})
//NIPPO FORM
function nippoFormInit(callback) {
    //INITIALIZE FORM FIELDS
    let userID = $('#userID').attr('data-value')
    if (getUrlParameter('y') != undefined && getUrlParameter('y')) {
        const year = getUrlParameter('y')
        const month = getUrlParameter('m')
        const date = getUrlParameter('d')
        initFormField(userID, `${month}/${date}/${year}`, 'nippo')
    } else {
        initFormField(userID, today, 'nippo')
    }

    //initFormField(userID,today,'genbanippo')
    //ENABLE SETTINGS
    nippoFormSetting()
    /*
    //ADD NEW FORM
    $('body').on('click','span.addGroupContainer',function(e){
        addNewForm($(this).attr('data-name'))
    })
    */
    /*
    //UPDATE INPUT FIELD ON CLICK
    $('.saveButton').on('click',function(){
        nippoFormOrder()
        $('input.statut').val('0')
    })
    $('.postButton').on('click',function(){
        nippoFormOrder()
        $('input.statut').val('1')
    })
    */
    //DISPLAY ALERT IF MORE THAN 10HOURS
    $(document).on('change', 'select.input-time', function () {
        updateTotalTime()
    })
    /*
    $(document).on("change",".input-type", function(){
        let currentType = $(this).val()
        let workerNameSelect = $(this).next('.input-workername')
        workerNameSelect.html('')
        $.get( "/api/koushu", function( data ) {
            data.forEach(element => {
                if(element!= undefined){
                    if( element.el == currentType){
                        element.name.forEach(element => {
                            if( element != ""){
                                workerNameSelect.append('<option>'+element+'</option>')
                            }
                        });
                    }
                }
            });
            });
    });
    */

    function nippoFormSetting() {

        //ADDING GROUP
        $('body').on('click', 'span.addGroop', function (e) {
            addGroupForm($(this).attr('data-name'), $(this).attr('data-value'))
        })
        $('.enableSetting').on('click', function () {
            $(document).find('.' + $(this).attr('data-name')).find('.settingOptions').fadeToggle(500)
            $('.' + $(this).attr('data-name') + 'Form').find('.settingOptions').fadeToggle(500)
            $('.' + $(this).attr('data-name') + 'Form .form-group').toggleClass('settingOn')

        })
        //ENABLE SETTING

        //REMOVE GROUP FIELD
        $('body').on('click', '.removeGroup', function () {
            let formSelect = $(this).attr('data-name')
            let formIndex = $(this).parent().closest('form').attr('data-value')
            let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
            if ($('body').find(formID + ' .form-container .form-group').length > 1) {
                $(formID + ' .form-group[data-value="' + $(this).attr('data-value') + '"]').fadeOut(500, function () {
                    $(this).remove()
                });
                let gIc = parseInt($(formID + ' .form-container .form-group').length - 1)
                $('.totalLine.' + formSelect).attr('value', gIc)

            }
            setTimeout(() => {
                nippoFormOrder()
                //saveToDB(formSelect,formIndex)
            }, 2000);
        })
        $('body').on('click', '.removeGroupContainer', function () {
            let formSelect = $(this).attr('data-name')
            let formIndex = $(this).parent().closest('form').attr('data-value')
            let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
            if ($('body').find('.' + formSelect + 'Form').length > 1) {
                $(formID).fadeOut(500, function () {
                    $(this).remove()
                });
                let gIc = parseInt($('.' + formSelect + 'Form').length - 1)
                $('.totalGroupContainer.' + formSelect).attr('value', gIc)

            }
            setTimeout(() => {
                nippoFormOrder()
                //saveToDB(formSelect,formIndex)
            }, 2000);
        })

    }
    function nippoFormOrder() {
        $.each($('form'), function () {
            $(this).find('.form-container .form-group').each(function (index, value) {
                index = index + 1
                $(this).attr('data-value', index)
                $.each($(this).find('.removeGroup'), function () {
                    $(this).attr('data-value', index)
                })
                $.each($(this).find('input'), function () {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                })
                $.each($(this).find('select'), function () {
                    if ($(this).attr('name')) {
                        let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                        $(this).attr('name', name + index)
                    } else {
                        let name = $(this).attr('data-name').substring(0, $(this).attr('data-name').indexOf('-') + 1)
                        $(this).attr('data-name', name + index)
                    }
                })
                $.each($(this).find('textarea'), function () {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                })
            })
        })
        $('body').find('.genbanippoForm').each(function (index, value) {
            index = index + 1
            $(this).attr('data-value', index)
            $(this).find('.removeGroupContainer').attr('data-value', index)
        })
    }
    function nippoChart(data) {
        let yData = Object.keys(data)
        let xData = []
        yData.forEach(element => {
            xData.push(data[element])
        });
        var data = [
            {
                type: 'bar',
                y: yData,
                x: xData,
                orientation: 'h',
                width: 0.5
            }
        ];

        Plotly.newPlot('nippoChart', data, {}, { staticPlot: true });
    }
    //AUTOSAVE FUNCTION
    function autoSaveNippoForm() {
        var timeoutId;
        $('body').on('input propertychange change', 'form', function () {
            let formSelect = $(this).attr('data-name')
            let formIndex = $(this).attr('data-value')
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function () {
                if (formSelect) {
                    //saveToDB(formSelect,formIndex);
                }
            }, 2000);
        });
        $('body').on('click', '.sendForm', function () {
            $('.savingPointerHide').hide()
            let spt1 = $(this).find('.savingPointer')
            spt1.show()
            if (!$('.savingPointerHide').is(':visible')) {
                $('form').each(function () {
                    if ($(this).is(':visible')) {
                        let formSelect = $(this).attr('data-name')
                        let formIndex = $(this).attr('data-value')
                        saveToDB(formSelect, formIndex, function () {
                            spt1.hide()
                            $('.savingPointerHide').show()
                            ichiranManage()
                            /*
                        setTimeout(() => {
                            window.location.reload(true)
                        }, 500);
                        */
                        });
                    }
                })
            }
            SUA({ event: '日報入力ページ', detail: '「送信ボタン」をクリック' })
        })
    }
    function validateForm(formSelect, index) {
        let result = []
        let formId = 'form.' + formSelect + '[data-value="' + index + '"]'
        $(formId).find('select').each(function () {
            if (($(this).val() == '') || ($(this).val() == null)) {
                //$(this).addClass('border border-danger')
                result.push(false);
                return false
            }
        })
        $(formId).find('textarea').each(function () {
            if (($(this).val() == '') || ($(this).val() == null)) {
                //$(this).addClass('border border-danger')
                result.push(false);
                return false
            }
        })
        if (result.includes(false) == false) {
            return true
        } else {
            alert('入力内容をご確認ください。')
            return false
        }

    }
    function saveToDB(formSelect, index, callback) {
        let formId = 'form.' + formSelect + '[data-value="' + index + '"]'

        //GET TOTAL LINE
        let totalLine = 0
        $(formId).find('.form-group[data-name="' + formSelect + '"]').each(function () {
            let n = $(this).attr('data-value')
            if (formSelect == 'nippo') {
                let genba = $(this).find('.input-genba[name="工事名-' + n + '"]').val()
                let type = $(this).find('.input-type[name="作業名-' + n + '"]').val()
                let time = $(this).find('.input-time[name="日-' + n + '"]').val()
                let subject = $(this).find('.input-subject[name="作業内容-' + n + '"]').val()
                /*
                console.log({
                    n:n,
                    genba:genba,
                    type:type,
                    time:time,
                    subject:subject
                })
                */
                if ((genba != null) || (type != null) || (time != null) || (subject != "")) {
                    totalLine += 1
                }
            } else {
                let koushu = $(this).find('.input-koushu[name="工種-' + n + '"]').val()
                let company = $(this).find('.input-company[name="業社名-' + n + '"]').val()
                let personal = $(this).find('.input-personal[name="人員-' + n + '"]').val()
                let subject = $(this).find('.input-subject[name="作業内容-' + n + '"]').val()
                /*
                console.log({
                    n:n,
                    koushu:koushu,
                    company:company,
                    personal:personal,
                    subject:subject
                })
                */
                if ((koushu != null) || ((company != null) && (company != "")) || ((personal != null) && (personal != "")) || (subject != "")) {
                    totalLine += 1
                }
            }

        })
        $(formId).find('.totalLine').val(totalLine)
        //console.log({totalLine:totalLine})
        $('.savingPointer[data-name="' + formSelect + '"]').fadeIn(500)
        let result = {}
        $(formId).find('input').each(function () {
            result[$(this).attr('name')] = $(this).val()

        })
        $(formId).find('select').each(function () {
            if (!$(this).hasClass('input-temp')) {
                if (($(this).val() == '') || ($(this).val() == null)) {
                    //$(this).addClass('border border-danger')
                } else {
                    if ($(this).hasClass('border border-danger')) {
                        $(this).removeClass('border border-danger')
                    }
                    result[$(this).attr('name')] = $(this).val()
                }
            }
        })
        $(formId).find('textarea').each(function () {
            if (($(this).val() == '') || ($(this).val() == null)) {
                //$(this).addClass('border border-danger')
            } else {
                if ($(this).hasClass('border border-danger')) {
                    $(this).removeClass('border border-danger')
                }
                result[$(this).attr('name')] = $(this).val()
            }
        })
        // $(formId).find('select').niceSelect('update')
        $.post('/api/' + formSelect, result, function () {
            setTimeout(() => {
                $('.savingPointer[data-name="' + formSelect + '"]').fadeOut(500)
                if (callback) { callback() }
            }, 1000);
        })
    }
    autoSaveNippoForm()
}
//UPDATE USERID FROM SELECT & RESET FORM & INIT ENTRIES
$(document).on('change', '.input-responsible.globalselector', function () {
    let userID = $(this).val()
    console.log({
        event: 'onChange .input-responsible',
        userID: userID
    })
    if (!!document.querySelector('#formPage')) {
        $('.input-genba.globalselector').attr('data-userid', userID)
        resetGroupForm()
        initFormField(userID, $('.input-date.globalselector').attr('data-date'))
        $('.SelectUserID').attr('data-selectid', userID)
    }
    ichiranManage()
    if (!!document.querySelector('.genbatoday')) {
        let ct = today
        if (!!document.querySelector('.input-date.globalselector')) {
            ct = $('.input-date.globalselector').attr('data-date')
        }
        genbatoday(userID, ct)
    }
})

function ichiranManage() {
    let userID = $('.input-responsible.globalselector').val() || $('#userID').attr('data-value')
    if (!!document.querySelector('#nippoichiran')) {
        let start = $('.period-list.globalselector').find('option:checked').attr('data-value').substring(0, $('.period-list.globalselector').find('option:checked').attr('data-value').indexOf(' -'))
        let end = $('.period-list.globalselector').find('option:checked').attr('data-value').substring($('.period-list.globalselector').find('option:checked').attr('data-value').indexOf('-'))
        nippoIchiranInit(userID, today, start, end)
    }
    if (!!document.querySelector('#genbaichiran')) {
        $('.input-genba.globalselector').attr('data-userid', userID)
        let start = $('.period-list.globalselector').find('option:checked').attr('data-value').substring(0, $('.period-list.globalselector').find('option:checked').attr('data-value').indexOf(' -'))
        let end = $('.period-list.globalselector').find('option:checked').attr('data-value').substring($('.period-list.globalselector').find('option:checked').attr('data-value').indexOf('-'))
        genbaIchiranInit(today, start, end)
    }
}
//DISPLAY NIPPO UNTIL YESTERDAY
function nippoIchiranInit(userID, today, start, end) {
    start = start || false; end = end || false
    if ((!start) && (!end)) {
        start = $('#start-period').attr('data-value')
        end = $('#end-period').attr('data-value')
    }
    if (!$('#nippoichiran').hasClass('ongoing')) {
        console.log({
            event: 'nippoIchiranInit',
            userID: userID,
            today: today,
            start: start,
            end: end,
        })
        $('#nippoichiran').addClass('ongoing')
        $('#nippoichiran .ichiran tbody').html('')
        $('#nippoichiran ul.ichiran').html('')
        $('#totalDays').html('')
        $('#info.nippo').html('')
        if (!$('#noResult').hasClass('d-none')) {
            $('#noResult').addClass('d-none')
        }
        if ($('#nippoichiran .loading').hasClass('d-none')) {
            $('#nippoichiran .loading').removeClass('d-none')
            $('.info.savingPointer').removeClass('d-none')
        }
        $.get('/api/nippoichiran?userID=' + userID + '&today=' + today + '&start=' + start + '&end=' + end, function (result) {

            $('#nippoichiran .ichiran thead tr').html('')
            $('#nippoichiran').show()
            //SET HEADINGS
            $('#nippoichiran .ichiran thead tr').prepend('<th scope="col" class="pl-2 py-2">日付</th><th scope="col" class="pl-2 py-2">現場名</th><th scope="col" class="pl-2 py-2">作業名</th><th scope="col" class="pl-2 py-2">日数</th><th scope="col" class="pl-2 py-2">作業内容</th><th scope="col" class="pl-2 py-2 d-none"></th>')
            if (result) {
                let info = { event: 'nippo-shukei', totalDays: 0 }
                result.forEach(data => {
                    let res_content = ''
                    if (data._id) {
                        for (let n = 1; n <= data.totalLine; n++) {
                            let col1 = data['工事名-' + n] || '-'
                            let col2 = data['作業名-' + n] || '-'
                            let col4 = data['日-' + n] || '-'
                            let col5 = data['作業内容-' + n] || '-'
                            let tt = 0
                            if ($.isNumeric(col4)) {
                                tt = parseFloat(col4)
                                info.totalDays += parseFloat(col4)
                            }
                            if (col1 != '-') {
                                if (!info[col1]) {
                                    info[col1] = { total: tt }
                                } else {
                                    info[col1].total += tt
                                }
                            }
                            let content = ''
                            let list_content_item = ''
                            if (!((col1 == '-') && (col2 == '-') && (col4 == '-') && (col5 == '-'))) {
                                if (!document.querySelector('.list-group-item[data-value="' + data['todayJP'] + '"]')) {
                                    let header_content = ''
                                    header_content += '<li class="list-group-item bg-transparent border-0 p-0 mb-2" data-id="' + data._id + '" data-value="' + data['todayJP'] + '">'
                                    header_content += '<div class="col-12 rounded-0 p-3 isweekend-' + data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(', '').replace(')', '') + '" style="font-size: 31px;">' + data['todayJP'] + '</div>'                            //content += '<td><select style="display:none" data-type="input-koushu" data-field="工種-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-koushu px-2 bg-white border border-secondary rounded" placeholder="'+col1+'" value="'+col1+'" name="工種-'+n+'" onchange="updateField(this)"></select></td>'
                                    header_content += '</li>'
                                    $('#nippoichiran ul.ichiran').append(header_content)
                                }
                                content += '<tr data-id="' + data._id + '" data-value="' + n + '" class="ms-nippoichiran removeThisIdHide">'
                                list_content_item += '<div class="list_container ms-nippoichiran row px-3 py-2 border rounded-0 m-0 bg-white" data-id="' + data._id + '" data-value="' + n + '">'
                                content += '<td><span class="pl-2 py-3 isweekend-' + data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(', '').replace(')', '') + '" style="width:auto;display:inline-block" data-name="todayJP">' + data['todayJP'] + '</span></td>'
                                list_content_item += '<div class="col" data-type="input-genba" data-field="工事名-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '" >' + col1 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-genba" data-field="工事名-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '">' + col1 + '</span></td>'
                                //content += '<td><select style="display:none" data-type="input-genba" data-field="工事名-'+n+'" data-name="'+userID+'_nippo" data-id="'+data._id+'" data-userid="'+userID+'" class="editor input-genba px-2 bg-white border border-secondary rounded" placeholder="'+col1+'" value="'+col1+'" name="工事名-'+n+'" onchange="updateField(this)"></select></td>'
                                list_content_item += '<div class="col" data-type="input-type" data-field="作業名-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '" >' + col2 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-type" data-field="作業名-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '">' + col2 + '</span></td>'
                                //content += '<td><select style="display:none" data-type="input-type" data-field="作業名-'+n+'" data-name="'+userID+'_nippo" data-id="'+data._id+'" data-userid="'+userID+'" class="editor input-type px-2 bg-white border border-secondary rounded" placeholder="'+col2+'" value="'+col2+'" name="作業名-'+n+'" onchange="updateField(this)"></select></td>'
                                list_content_item += '<div class="col" data-type="input-time" data-field="日-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '" >' + col4 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-time" data-field="日-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '">' + col4 + '</span></td>'
                                //content += '<td><select style="display:none" data-type="input-time" data-field="日-'+n+'" data-name="'+userID+'_nippo" data-id="'+data._id+'" data-userid="'+userID+'" class="editor input-time px-2 bg-white border border-secondary rounded" placeholder="'+col4+'" value="'+col4+'" name="日-'+n+'" onchange="updateField(this)"></select></td>'
                                list_content_item += '<div class="col-12 py-2"" data-type="input-subject" data-field="日-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '" >' + col5 + '</div>'
                                content += '<td><span class="pl-2 py-3 " style="width:auto;display:inline-block" data-type="input-subject" data-field="作業内容-' + n + '" data-name="' + userID + '_nippo" data-id="' + data._id + '" data-userid="' + userID + '">' + col5 + '</span></td>'
                                //content += '<td><input data-type="input-subject" data-field="作業内容-'+n+'" data-name="'+userID+'_nippo" data-id="'+data._id+'" data-userid="'+userID+'" class="editor input-subject px-2 py-2 bg-white border border-secondary rounded" type="text" placeholder="'+col5+'" value="'+col5+'" name="作業内容-'+n+'" onkeyup="updateField(this)" onclick="updateField(this)"/></td>'
                                //content += '<td class="text-center" style="cursor:pointer"><span data-feather="lock" class="locked mx-5" data-id="'+data._id+'" data-value="'+n+'" style="width:15px;height:15px;display:none;"></span><span data-feather="edit" data-id="'+data._id+'" data-value="'+n+'"  data-name="'+userID+'_nippo"  class="editThisId d-none mr-5" style="width:15px;height: 15px;"></span><span data-feather="trash" data-id="'+data._id+'"  data-value="'+n+'" data-name="'+userID+'_nippo"  class="removeThisId" style="display:none;width:15px;height: 15px;"></span></td>'
                                content += '</tr>'
                                list_content_item += '</div>'
                                $('#nippoichiran ul.ichiran .list-group-item[data-value="' + data['todayJP'] + '"]').append(list_content_item)
                                res_content += content
                            }
                        }
                        $('#nippoichiran .ichiran tbody').append(res_content)
                    }
                });
                //console.log(info)
                $('#info.nippo').append('<ul class="list-group"><li class="list-group-item ms-design showall" data-ms-base="ms-nippoichiran">合計 : ' + info['totalDays'] + '</li></ul>')
                Object.keys(info).forEach(k => {
                    if (typeof info[k] === 'object' && info[k] !== null) {

                        let content = ''
                        content += '<div class="card"><div class="card-header collapsed" id="' + k + '" data-toggle="collapse" data-target="#collapse-' + k + '" aria-expanded="true" aria-controls="collapse-' + k + '">'
                        content += '<h5 class="mb-0 float-left ms-design" data-ms-key="' + k + '" data-ms-base="ms-nippoichiran" onclick="makeSearch(this)">'
                        content += k + ' : ' + info[k].total
                        content += '</h5>'
                        content += '</div>'
                        $('#info.nippo').append(content)
                    }
                });
                //$('#totalDays').append(info.totalDays)
            }
            if ($('#nippoichiran .ichiran tbody tr').length == 0) {
                if ($('#noResult').hasClass('d-none')) {
                    $('#noResult').removeClass('d-none')
                }
            }
            if (!$('#nippoichiran .loading').hasClass('d-none')) {
                $('#nippoichiran .loading').addClass('d-none')
                $('.info.savingPointer').addClass('d-none')
            }
            /*
            $(document).find('.editThisId').each(function(){
                if(!$('.edit-options').hasClass('off')){
                    $(this).click()
                }
            })
            */
            //userLevelEdit()
            //inputInit();
            resizeInput();
            $('select.period-list').niceSelect('update')
            feather.replace();
            adminOnly()
            $('#nippoichiran').removeClass('ongoing')
        })
    }
}
function initFormField(userID, day, editForm) {
    if (editForm == undefined) {
        $('form').each(function () {
            if ($(this).attr('data-name') != undefined) {
                initFormField(userID, day, $(this).attr('data-name'))
            }

        })
    } else {
        let genbaID = $('.input-genba[data-name="genbanippo"]').find('option:checked').attr('data-id')
        console.log({
            event: 'initFormField',
            editForm: editForm,
            userID: userID,
            genbaID: genbaID,
            day: day,
        })
        let formID = $('form.' + editForm)
        if (editForm == 'genbanippo') {
            if (genbaID) {
                $.get('/api/' + genbaID + '_' + editForm + '?day=' + day, function (result) {
                    let element = []
                    result.forEach(data => {
                        if (data.userID == userID) {
                            element.push(data)
                        }
                    });
                    element = element[0]
                    doForm(formID, element, day, editForm)
                })
            } else {
                doForm(formID, false, day, editForm)
            }
        } else {
            $.get('/api/' + userID + '_' + editForm + '?day=' + day, function (element) {
                element = element[0]
                doForm(formID, element, day, editForm)
            })
        }
        //updateListGlobalSelector(editForm,userID)
        /*
        //CHART
        $.get('/api/nippochart/'+userID,function(data){
            if(data){
                nippoChart(data)
            }
        })
        */
    }
}
function doForm(formID, element, day, editForm) {
    $.each(formID.find('.input-temp'), function () {
        $(this).remove()
    })
    if (element && (element.totalLine > 0)) {
        console.log({
            event: 'doForm',
            data: element
        })
        if (element.today == day) {
            let statut = element.statut
            let totalLine = element.totalLine
            for (let i = 1; i < totalLine; i++) {
                let formSelect = formID.attr('data-name')
                addGroupForm(formSelect, 1)
            }
            $.each(formID.find('input'), function () {
                let name = $(this).attr('name')
                let newVal = element[name]
                formID.find('input[name="' + name + '"]').val(newVal).change()
                formID.find('input[name="' + name + '"]').attr('value', newVal)
            })
            $.each(formID.find('select'), function () {
                let name = $(this).attr('name')
                let newVal = element[name]
                formID.find('select[name="' + name + '"]').val(newVal).change()
                formID.find('select[name="' + name + '"]').attr('value', newVal)
                formID.find('select[name="' + name + '"]').niceSelect('update')
            })
            $.each(formID.find('textarea'), function () {
                let name = $(this).attr('name')
                let newVal = element[name]
                formID.find('textarea[name="' + name + '"]').val(newVal).change()
                formID.find('textarea[name="' + name + '"]').attr('value', newVal)
            })
        } else {
            $.each(formID.find('select'), function () {
                $(this).val('').change()
                $(this).niceSelect('update')
            })
            $.each(formID.find('textarea'), function () {
                $(this).val('').change()
                console.log($(this).val())
            })
        }
    } else {
        let formSelect = formID.attr('data-name')
        $.get('/api/globalsetting/', function (setting) {
            setting = setting[0]
            let totalLine = setting[formSelect + 'DefaultLine']
            for (let i = 1; i < totalLine; i++) {
                addGroupForm(formSelect, 1)
            }
            //SET DEFAULT SETTINGS
            let GuserID = null
            let userName = null
            if (!!document.querySelector('.input-responsible.globalselector')) {
                GuserID = $('select.input-responsible.globalselector').val()
                userName = $('select.input-responsible.globalselector').find('option:checked').text()
            } else {
                GuserID = $('#userID').attr('data-value')
                userName = $('#userName').attr('data-value')
            }
            let genbaID = $('.input-genba[data-name="genbanippo"]').find('option:checked').attr('data-id')
            let genbaName = $('.input-genba[data-name="genbanippo"]').val()
            if (GuserID != null) {
                $('form.' + editForm).find('.input-userID').val(GuserID)
                $('form.' + editForm).find('.input-userName').val(userName)
            }
            if (genbaID != null) {
                $('form.' + editForm).find('.input-genbaID').val(genbaID)
                $('form.' + editForm).find('.input-genbaName').val(genbaName)
            }
            console.log({
                event: 'doForm -> default form init',
                formSelect: formSelect,
                userName, userName,
                GuserID: GuserID,
                totalLine: totalLine,
                setting: setting,
                genbaID: genbaID,
                genbaName: genbaName,
            })
            $.each(formID.find('select'), function () {
                $(this).val('').change()
                $(this).niceSelect('update')
            })
            $.each(formID.find('textarea'), function () {
                $(this).val('').change()
            })
        })
    }
}
function updateTotalTime() {
    let count = 0
    $.each($('select.input-time'), function () {
        if ($(this).val() != null) {
            count += parseFloat($(this).val())
        }
    })
    if (count > 1.5) {
        $('.alert').fadeIn(500)
    } else {
        $('.alert').fadeOut(500)
    }
    $('#totalTime').text(count)
    $('.totalTime').val(count)
}
function resetGroupForm(formSelectQuery) {
    if (formSelectQuery == undefined) {
        $('form').each(function () {
            if ($(this).attr('data-name') != undefined) {
                resetGroupForm($(this))
            }
        })
    } else {
        console.log({
            event: 'resetGroupForm',
            formSelectQuery: formSelectQuery
        })
        let $this = formSelectQuery
        let formSelect = $this.attr('data-name')
        let formIndex = $this.attr('data-value')

        let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
        if ($(formID + ' .form-group-container').length > 0) {
            let groupContainer = $(formID + ' .form-group-container').first().clone()
            $(formID + ' .form-group-container').remove()
            $(formID).append(groupContainer).fadeIn(500);
            let groupForm = $(formID + ' .form-group-container .form-group').first().clone()
            $(formID + ' .form-group-container .form-group').remove()
            $(formID + ' .form-group-container .form-container').append(groupForm).fadeIn(500);
            $('.totalLine.' + formSelect).attr('value', 1)
            groupContainer.find('.removeGroup').attr('data-value', formIndex)
            groupContainer.find('.addGroop').attr('data-value', formIndex)
            $('.addGroupContainer').attr('data-value', formIndex)
            $.each(groupContainer.find('input'), function () {
                let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                $(this).attr('name', name + '1')
                $(this).val('').change()
            })
            $.each(groupContainer.find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
            $.each(groupContainer.find('textarea'), function () {
                let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                $(this).attr('name', name + '1')
                $(this).val('').change()
            })
        } else {
            let group = $(formID + ' .form-container .form-group').first().clone()
            $(formID + ' .form-container .form-group').remove()
            $(formID + ' .form-container').append(group).fadeIn(500);
            $('.totalLine.' + formSelect).attr('value', 1)
            group.find('.removeGroup').attr('data-value', 1)
            $.each(group.find('input'), function () {
                let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                $(this).attr('name', name + '1')
                $(this).val('').change()
            })
            $.each(group.find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
            $.each(group.find('textarea'), function () {
                let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                $(this).attr('name', name + '1')
                $(this).val('').change()
            })
        }
    }
}
function addGroupForm(formSelect, formIndex) {
    let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
    let group = $(formID + ' .form-container .form-group').last().clone()
    let currVal = parseInt(group.attr('data-value')) + 1
    if (currVal > 10) {
        alert('Maximum entry is 10')
    } else {
        group.find('.input-temp').remove()
        group.attr('data-value', currVal)
        let gIc = parseInt($(formID + ' .form-container .form-group').length + 1)
        $('.totalLine.' + formSelect).attr('value', gIc)
        group.find('.removeGroup').attr('data-value', currVal)
        group.find('label').remove()
        $(formID + ' .form-container').append(group).fadeIn(500);
        $.each(group.find('input'), function () {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
            $(this).attr('value', '')
        })
        $.each(group.find('select'), function () {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
            $(this).niceSelect('update')
        })
        $.each(group.find('textarea'), function () {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
        })
    }

}
function resetSetting() {
    let countContainer = false
    $('form').each(function () {
        let formSelect = $(this).attr('data-name')
        let formIndex = $(this).attr('data-value')
        let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
        let countGroup = false
        if (parseInt($(formID + ' .form-group').length) > 1) {
            countGroup = true
        }
        if (parseInt($('.genbanippoForm').length) > 1) {
            countContainer = true
        }
        if (countGroup || countContainer) {
            $('.enableSetting[data-name="' + formSelect + '"]').fadeIn(500)
        } else {
            $('.enableSetting[data-name="' + formSelect + '"]').hide()
            $(formID + ' .settingOptions').hide()
            $(formID + ' .form-group').removeClass('settingOn')
        }
        if ($(formID + ' .form-group').first().hasClass('settingOn')) {
            $(formID + '.settingOptions.GroupContainer').show()
        } else {
            $(formID + '.settingOptions.GroupContainer').hide()
        }

    })

}
function genbatoday(userID, today) {
    $('.genbatoday').html('')
    $('.genbatodayloading').show()
    if (userID == undefined) { userID = $('#userID').attr('data-value') }
    $.get('/api/genba/today' + userID + '?today=' + today, function (result) {
        console.log({
            event: 'genbatoday',
            userID: userID,
            today: today,
            result: result,
        })
        $('.genbatodayloading').hide()
        if (result.length > 0) {
            result.forEach(element => {
                $('.genbatoday').append('<button class="btn btn-success btn-sm mx-2" data-id="' + element.genbaID + '" data-name="' + element.genbaName + '">' + element.genbaName + '</button>')
            });
        } else {
            $('.genbatoday').append('<span class="text-secondary" style="font-size:12px">データがございません。</span>')
        }
    })
}

$(document).on('click', '.genbatoday button', function () {
    let genbaID = $(this).attr('data-id')
    let genbaName = $(this).attr('data-name')
    console.log({
        event: 'genbatoday',
        genbaID: genbaID,
        genbaName: genbaName
    })
    $('select.input-genba.globalselector').val(genbaName).change()
    $('select.input-genba.globalselector').niceSelect('update')
})
function genbaNippoInit() {
    //DISPLAY LIST OF GENBA
    if (!!document.querySelector("#genbanippolist")) {
        initNippoGenba()
        let genbaSelect = $('#genbanippolist')
        let designBase = genbaSelect.find('li').clone()
        genbaSelect.find('li').remove()
        $.get("/api/genba", function (data) {
            data.forEach(element => {
                setTimeout(() => {
                    $.get('/api/' + element._id + '_genbanippo', function (el) {
                        let content = designBase.clone()
                        if (element.工事名) {
                            let responsibleID = element.担当者 || ""
                            let genbaID = element._id || ""
                            let col1 = element.工事名 || ""
                            let col2 = element.発注者 || ""
                            let col3 = element.担当者 || ""
                            let col4 = element.状況 || ""
                            let col5 = el.length || ""
                            if (col4) {
                                $.get("/users/info/" + col3, function (res) {
                                    if (res.lname) {
                                        col3 = res.lname + ' ' + res.fname
                                    } else {
                                        col3 = ''
                                    }
                                    content.attr('data-link', '/dashboard/genbanippo/new?genbaID=' + element._id)
                                    content.attr('data-genba', genbaID)
                                    content.attr('data-responsible', responsibleID)
                                    content.find('.provider').text(col1)
                                    content.find('.responsible').text(col3)
                                    content.find('.genbanippoForm input[name="工事名"]').val(genbaID)
                                    if (col5 > 0) {
                                        content.find('.info').show()
                                        content.find('.quantity').text(col5)
                                    }
                                    genbaSelect.append(content)
                                })
                            }

                        }
                    });
                }, 100);
            });
        });
    }
    function initNippoGenba() {
        //MANAGE SELECT OPTION
        $('body').on('propertychange change', 'select[data-name="genbanippo"]', function () {
            let selectName = $(this).val()
            let selectType = $(this).attr('data-select')
            let curGenba = []
            $('#genbanippolist li').each(function () {
                if (selectType == 'genba') {
                    if ($(this).attr('data-genba') != selectName) {
                        $(this).hide()
                    } else {
                        $(this).show()
                    }
                }
                if (selectType == 'responsible') {
                    if ($(this).attr('data-responsible') != selectName) {
                        $(this).hide()
                    } else {
                        $(this).show()
                        curGenba.push($(this).attr('data-genba'))
                    }
                }
            })
            updateSelectOption(curGenba)
        })
    }
    //HIDE/SHOW GENBA IN ACCORDANCE WITH USER
    function updateSelectOption(curGenba) {
        let selector = $('select.input-genba[data-name="genbanippo"]')
        if ($('select.input-responsible').val() != null) {
            selector.find('option').each(function () {
                if (!curGenba.includes($(this).attr('data-id'))) {
                    if (!$(this).parent().is("span")) {
                        $(this).wrap("<span>")
                    }
                } else {
                    if ($(this).parent().is("span")) {
                        $(this).unwrap();
                    }
                }
            });
        }
    }
}
//DISPLAY GENBA ICHIRAN
async function genbaIchiranInit(today, start, end) {
    start = start || false; end = end || false
    if ((!start) && (!end)) {
        let period = await $.get('/api/globalsetting')
        start = period[0].period_start
        end = period[0].period_end
    }
    let genbaID = $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('data-id')
    let genbaName = $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('value')
    console.log({
        event: 'genbaIchiranInit',
        genbaID: genbaID,
        genbaName: genbaName,
        today: today,
        start: start,
        end: end,
    })
    if (genbaID != undefined) {
        $('.alert-genba').hide()
        $('#genbaichiran .ichiran tbody').html('')
        $('#genbaichiran ul.ichiran').html('')
        $('#info.genba').html('')
        if (!$('#noResult').hasClass('d-none')) {
            $('#noResult').addClass('d-none')
        }
        if ($('.loading').hasClass('d-none')) {
            $('.loading').removeClass('d-none')
        }
        if (!$('.info.savingPointer').is(':visible')) {
            $('.info.savingPointer').show()
        }


        $.get('/api/genbaichiran?genbaID=' + genbaID + '&today=' + today + '&start=' + start + '&end=' + end, function (result) {
            if (result) {
                $('#genbaichiran .ichiran thead tr').html('')
                $('#genbaichiran').show()
                //SET HEADINGS TABLE
                $('#genbaichiran .ichiran thead tr').prepend('<th scope="col" class="pl-2 py-2">日付</th><th scope="col" class="pl-2 py-2">工種</th><th scope="col" class="pl-2 py-2">業社名</th><th scope="col" class="pl-2 py-2">人員</th><th scope="col" class="pl-2 py-2">作業内容</th><th scope="col" class="pl-2 py-2">入力者名</th><th scope="col" class="d-none pl-2 py-2"></th>')
                //SHUKEI INFO
                $('.card.info').show()
                $('.info.savingPointer').show()
                $('.nice-select.input-genba.globalselector').addClass('disabled')
                $('select.input-genba.globalselector').prop('disabled', true)
                $('#info.genba').html('')

                let info = { event: 'genba-shukei', 工種合計: 0 }
                result.forEach(data => {
                    let res_content = ''
                    for (let n = 1; n <= data.totalLine; n++) {
                        if (data) {
                            let col1 = data['工種-' + n] || '-'
                            let col2 = data['業社名-' + n] || '-'
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
                                if (!document.querySelector('.list-group-item[data-value="' + data['todayJP'] + '"]')) {
                                    let header_content = ''
                                    header_content += '<li class="list-group-item bg-transparent border-0 p-0 mb-2" data-id="' + data._id + '" data-value="' + data['todayJP'] + '">'
                                    header_content += '<div class="col-12 rounded-0 p-3 isweekend-' + data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(', '').replace(')', '') + '" style="font-size: 31px;">' + data['todayJP'] + '</div>'                            //content += '<td><select style="display:none" data-type="input-koushu" data-field="工種-'+n+'" data-name="'+genbaID+'_genbanippo" data-id="'+data._id+'" data-userid="'+data.userID+'" class="editor input-koushu px-2 bg-white border border-secondary rounded" placeholder="'+col1+'" value="'+col1+'" name="工種-'+n+'" onchange="updateField(this)"></select></td>'
                                    header_content += '</li>'
                                    $('#genbaichiran ul.ichiran').append(header_content)
                                }
                                content += '<tr data-id="' + data._id + '" data-value="' + n + '" class="ms-genbanippo removeThisIdHide">'
                                list_content_item += '<div class="list_container ms-genbanippo row px-3 py-2 border rounded-0 m-0 bg-white" data-id="' + data._id + '" data-value="' + n + '">'
                                content += '<td><span class="pl-2 py-3 isweekend-' + data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(', '').replace(')', '') + '" style="width:auto;display:inline-block" data-name="todayJP" data-value="' + data['todayJP'] + '">' + data['todayJP'] + '</span></td>'
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
                if (!$('.loading').hasClass('d-none')) {
                    $('.loading').addClass('d-none')
                }

                $.get('/api/shukei', function (data) {
                    if (data[0].todayJP) {
                        let ctodayJP = data[0].todayJP
                        data = data[0][genbaName]
                        $('.info.savingPointer').hide()
                        $('.nice-select.input-genba.globalselector').removeClass('disabled')
                        $('select.input-genba.globalselector').prop('disabled', false)
                        let dTotal = 0; let dDetail = {}
                        if ($.isNumeric(data.作業時間) == true) {
                            dTotal = data.作業時間
                        }
                        if (typeof data.detail === 'object') {
                            dDetail = data.detail
                        }
                        info['現場監督'] = { total: parseFloat(dTotal), detail: dDetail }
                        info.工種合計 += parseFloat(dTotal)
                        info.工種合計 = info.工種合計.toFixed(2)
                        console.log({
                            event: 'shukei',
                            genbaName: genbaName,
                            info: info,
                            today: today,
                        })
                        $('.shukei_todayJP').html(' ' + ctodayJP)
                        $('#info.genba').append('<ul class="list-group"><li class="list-group-item ms-design showall" data-ms-base="ms-genbanippo" >工種合計 : ' + info['工種合計'] + '</li></ul>')
                        Object.keys(info).forEach(k => {
                            if (typeof info[k] === 'object' && info[k] !== null) {

                                let content = ''
                                content += '<div class="card"><div class="card-header collapsed" id="' + k + '" data-toggle="collapse" data-target="#collapse-' + k + '" aria-expanded="true" aria-controls="collapse-' + k + '" style="cursor:pointer">'
                                content += '<h5 class="mb-0 float-left ms-design" data-ms-key="' + k + '" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">'
                                content += k + ' : ' + info[k].total
                                content += '</h5>'
                                content += '<div data-feather="minus" class="float-right off" style="display:inline"></div><div data-feather="plus" class="float-right on" style="display:none"></div>'
                                content += '</div>'
                                content += '<div id="collapse-' + k + '" class="collapse" aria-labelledby="' + k + '" data-parent="#info">'
                                content += '<div class="card-body"><ul class="list-group">'
                                Object.keys(info[k].detail).forEach(kk => {
                                    content += '<li class="list-group-item ms-design" data-ms-key="' + kk + '" data-ms-base="ms-genbanippo" onclick="makeSearch(this)">' + kk + ' : ' + info[k].detail[kk] + '</li>'
                                })
                                content += '</ul></div></div></div>'
                                $('#info.genba').append(content)
                            }
                        });
                    }
                })

            } else {
                if ($('#genbaichiran .ichiran tbody tr').length == 0) {
                    if ($('#noResult').hasClass('d-none')) {
                        $('#noResult').removeClass('d-none')
                    }
                }
                if (!$('.loading').hasClass('d-none')) {
                    $('.loading').addClass('d-none')
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
    }

}
//NIPPO SHUKEI
function nipposhukeiInit() {
    //作業時間 to 日
    $.get('/api/shukei', function (data) {
        data = data[0]
        //console.log(data)
        let genbas = Object.keys(data)
        genbas.forEach(genba => {
            let shukei = data[genba]
            if (typeof shukei === 'object') {
                let content = '<tr>'
                content += '<td>' + genba + '</td>'
                content += '<td class="responsible-name">' + shukei.作業者 + '</td>'
                content += '<td>' + shukei.作業時間 + ' 日</td>'
                content += '</tr>'
                $('table.table.shukei tbody').append(content)


                let detail = shukei.detail
                let names = Object.keys(detail)
                names.forEach(name => {
                    let content = '<tr>'
                    content += '<td class="responsible">' + name + '</td>'
                    content += '<td>' + genba + '</td>'
                    content += '<td>' + detail[name] + ' 日</td>'
                    content += '</tr>'
                    $('table.table.genba tbody').append(content)
                });
            }
        });
        updateUserInfo()
        nipposhukeiChart(data)
        displayShukeiPeriodList()
        //EXPORT CSV
        $('.export-shukei').on('click', function () {
            let win = window.open('/api/csv/shukeiCSV')
        })
        $('.export-genba').on('click', function () {
            let win = window.open('/api/csv/genbasCSV')
        })
    })
}
function displayCompanyShukei(el) {
    let k = $(el).val()
    $('.company-shukei-container').html('')
    $.get('/api/companyShukei', function (result) {
        result = result[0][k]
        let companies = Object.keys(result)
        let avoidthis = ['_id', 'undefined', '', 'date', 'today', 'todayJP']
        companies.forEach(company => {
            if (avoidthis.includes(company) == false) {
                let shukei = result[company]['data']
                if (typeof shukei === 'object') {
                    let content = $('.template.companyShukei').clone()
                    content.removeClass('template')
                    content.attr('data-value', company)
                    content.find('.companyName').append('<span>' + company + '</span>')
                    content.find('.companyTotal').append('<span>' + result[company]['合計人員'] + '</span>')

                    let genbas = Object.keys(shukei)
                    genbas.forEach(genba => {
                        let s_content = $('.template.genbaShukei.card').clone()
                        s_content.removeClass('template')
                        s_content.attr('data-value', company)
                        s_content.find('.genbaName').append('<span>' + genba + '</span>')
                        s_content.find('.genbaTotal').append('<span>' + shukei[genba]['合計人員'] + '</span>')
                        let s_shukei = shukei[genba]['data']
                        let ss_content = ''
                        s_shukei.forEach(res => {
                            let dd = ['todayJP', '工種', '業社名', '人員', '作業内容', 'userName']
                            ss_content += '<tr>'
                            for (let i = 0; i < dd.length; i++) {
                                let val = res[dd[i]]
                                ss_content += '<td class="px-3">' + val + '</td>'
                            }
                            ss_content += '</tr>'
                        })
                        s_content.find('table.table.company tbody').append(ss_content)
                        content.append(s_content)
                    })
                    $('.company-shukei-container').append(content)
                    $('select.input-company').append('<option value="' + company + '">' + company + '</option>')
                }
            }
        })
        $('select.input-company').niceSelect('update')
        //$('.template.companySHukei').remove()
        //inputInit()
        selectCompnay()
    })
}
function nipposhukeiChart(data) {
    let yData = Object.keys(data)
    let xData = []
    yData.forEach(genba => {
        let shukei = data[genba]
        if (typeof shukei === 'object') {
            xData.push(shukei.作業時間)
        } else {
            delete yData[yData.indexOf(genba)];
        }
    });
    var data = [
        {
            type: 'bar',
            x: yData,
            y: xData,
            orientation: 'w',
            width: 0.5
        }
    ];
    var layout = {
        xaxis: {
            tickangle: -45,
            automargin: true,
        },
        margin: {
            //l: 0,
            //r: 0,
            //b: 0,
            t: 0,
            pad: 4
        },
        barmode: 'group'
    };
    Plotly.newPlot('shukeiChart', data, layout, { staticPlot: false, scrollZoom: false, editable: false, displayModeBar: false });

    //PIE
    var data = [{
        values: xData,
        labels: yData,
        type: 'pie'
    }];

    var layout = {
        height: 700,
        width: 700
    };

    //Plotly.newPlot('shukeiChart', data, layout);
}
function displayShukeiPeriodList() {
    let options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    }
    $.get('/api/globalsetting', function (data) {
        let globalsetting = data[0]
        for (let i = 0; i <= 1; i++) {
            let period_start = new Date(globalsetting.preiodList[i].start).toLocaleDateString('ja-JP', options)
            let period_end = new Date(globalsetting.preiodList[i].end).toLocaleDateString('ja-JP', options)
            $('.periodList.globalselector').prepend('<option value="' + i + '">' + period_start + ' - ' + period_end + '</option>')
        }
        $('.periodList.globalselector').change()
    })
}
function selectCompnay() {
    $('select.input-company').on('change', function () {
        let company = $(this).val()
        $('.companyShukei').hide()
        $('.companyShukei[data-value="' + company + '"]').show()
        $('.genbaShukei[data-value="' + company + '"]').show()
    })
    $('select.input-company').change()
    $('.showall').on('click', function () {
        $('.company-shukei-container .companyShukei').show()
        $('.company-shukei-container .genbaShukei').show()
    })
    $('.companyShukei.template').hide()
    $('.genbaShukei.template').hide()
}
//NIPPO EVERY
function nippoEveryInit() {
    inputInit()
    //CHECK IF IS RUNNING AND DISABLE
    $('#searchEvery').on('click', function () {

        if (!$('#noResult').hasClass('d-none')) {
            $('#noResult').addClass('d-none')
        }
        if ($('#loading').hasClass('d-none')) {
            $('#loading').removeClass('d-none')
        }
        $('table.table.every tbody').html('')
        let startDate = "" || $('#startDate').attr('data-date')
        let endDate = "" || $('#endDate').attr('data-date')
        let genba = "" || $('#genba').val()
        let type = "" || $('#type').val()
        let responsible = "" || $('#responsible').val()
        console.log({
            event: '#searchEvery click -> nippoEveryInit ',
            req: { startDate: startDate, endDate: endDate, genba: genba, type: type, responsible: responsible },
        })
        $.get('/api/filter?startDate=' + startDate + '&endDate=' + endDate + '&genba=' + genba + '&type=' + type + '&responsible=' + responsible, function (result) {
            console.log({
                event: 'nippoEveryInit -> GET',
                result: result.length
            })
            if (result.length > 0) {
                result.forEach(data => {
                    for (let i = 1; i <= data.totalLine; i++) {
                        if (data['工事名-' + i]) {
                            if (data['作業名-' + i] == undefined) { data['作業名-' + i] = '-' }
                            if (data['日-' + i] == undefined) { data['日-' + i] = '-' }
                            if (data['作業内容-' + i] == undefined) { data['作業内容-' + i] = '-' }
                            let content = '<tr data-id="' + data._id + '" data-value="' + i + '" class="element removeThisIdHide">'
                            content += '<td class="date" data-value="' + data.日付 + '" >' + data.todayJP + '</td>'
                            content += '<td class="responsible" data-value="' + data.userID + '"" style="cursor:pointer" >' + data.userName + '</td>'
                            content += '<td class="genba" data-value="' + data['工事名-' + i] + '" style="cursor:pointer" >' + data['工事名-' + i] + '</td>'
                            content += '<td class="type" data-value="' + data['作業名-' + i] + '" style="cursor:pointer" >' + data['作業名-' + i] + '</td>'
                            content += '<td class="time" data-value="' + data['日-' + i] + '" style="cursor:pointer" >' + data['日-' + i] + ' 日</td>'
                            content += '<td class="time" data-value="' + data['作業内容-' + i] + '" style="cursor:pointer" >' + data['作業内容-' + i] + '</td>'
                            content += '<td class="text-center" style="cursor:pointer"><span data-feather="lock" class="locked mx-5" data-id="' + data._id + '" data-value="' + i + '" style="width:15px;height:15px;display:none;"></span><span data-feather="edit" data-id="' + data._id + '" data-value="' + i + '"  data-name="' + data.userID + '_nippo"  class="editThisId d-none mr-5" style="width:15px;height: 15px;"></span><span data-feather="trash" data-id="' + data._id + '"  data-value="' + i + '" data-name="' + data.userID + '_nippo"  class="removeThisId" style="display:none;width:15px;height: 15px;"></span></td>'
                            content += '</tr>'
                            $('table.table.every tbody').append(content)
                        }
                    };
                });
            } else {
                if ($('#noResult').hasClass('d-none')) {
                    $('#noResult').removeClass('d-none')
                }
            }
            if (!$('#loading').hasClass('d-none')) {
                $('#loading').addClass('d-none')
            }
            //updateUserInfoOnly()
            //HIGHLIGHT INFO
            let highObj = {
                genba: genba,
                type: type,
                responsible: responsible
            }
            let countSelectors = 0
            Object.keys(highObj).forEach(key => {
                if (highObj[key] != null) {
                    countSelectors += 1
                }
                $.each($('.' + key), function () {
                    if ($(this).attr('data-value') == highObj[key]) {
                        $(this).addClass('font-weight-bold')
                        $(this).addClass('sFilter')
                    }
                })
                $('body').on('click', '.' + key, function () {
                    $('select[name="' + $(this).attr('class') + '"] option[value="' + $(this).attr('data-value') + '"]').prop({ selected: true }).change();
                    $('select[name="' + $(this).attr('class') + '"]').niceSelect('update')
                })
            });
            $.each($('tr.element'), function () {
                if ($(this).find('td.sFilter').length < countSelectors) {
                    $(this).hide()
                }
            })
        })
    })
    //EXPORT CSV
    $('.export-all').on('click', function () {
        let win = window.open('/api/csv/filterCSV')
    })

    $('#startDate').datepicker({
        language: "ja",
        format: 'yyyy年mm月dd日',
        autoclose: true,
        endDate: new Date()
    }).on('changeDate', function (e) {
        let dd = new Date(e.date)
        let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
        $('#startDate').attr('data-date', ct)

    });
    $('#startDate').val(todayJP)
    $('#startDate').attr('data-date', today)
    $('#endDate').datepicker({
        language: "ja",
        format: 'yyyy年mm月dd日',
        autoclose: true,
        endDate: new Date()
    }).on('changeDate', function (e) {
        let dd = new Date(e.date)
        let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
        $('#endDate').attr('data-date', ct)
    });
    $('#endDate').val(todayJP)
    $('#endDate').attr('data-date', today)
}
//SETTING GENBA PAGE
function SettingsGenbaInit() {
    console.log({
        event: 'SettingsGenbaInit'
    })
    $.fn.autoKana('input[name="工事名"]', 'input[name="工事名kana"]');

    if (!!document.querySelector(".table#genba")) {
        SUA({ event: '現場一覧ページ' })
        let genbaSelect = $('.table#genba')
        $.get("/api/genba", function (data) {
            data = sortit(data, '工事名kana')
            for (let index = 0; index < data.length; index++) {
                let element = data[index]
                if (element.工事名) {
                    let col1 = element.工事名 || ""
                    let col2 = element.発注者 || ""
                    let col3 = element.担当者 || ""
                    let col4 = element.工事名kana || ""
                    genbaSelect.find('tbody').append('<tr class="clickable" data-link="/dashboard/settings/genba?genbaID=' + element._id + '"><td>' + col1 + '</td><td>' + col4 + '</td><td>' + col2 + '</td><td class="responsible">' + col3 + '</td></tr>')
                    /*
                    $.get("/users/info/"+col3,function(res){
                        if(res.lname){
                            col3 = res.lname+' '+res.fname
                        }else{
                            col3 = ''
                        }
                    })
                    */
                }
            };
            updateUserInfo()
        });
    }
    function updateSelect() {
        $('#editGenba form select').each(function () {
            $(this).find('option[value="' + $(this).attr('value') + '"]').prop('selected', true)
        })
    }
    if (!!document.querySelector('#formResponsible')) {
        let userID = $('#userID').attr('data-value')
        let genbaID = getUrlParameter('genbaID')
        /*
        console.log({
            event:'formResponsible',
            userID:userID,
            genbaID:genbaID,
        })
        */
        $.get("/api/users", function (data) {
            data.forEach(element => {
                let content = '<option value="' + element._id + '">' + element.lname + ' ' + element.fname + '</option>'
                if ((element._id == userID) && (genbaID == 0)) {
                    $('select#formResponsible').prepend(content)
                } else {
                    $('select#formResponsible').append(content)
                }
            });
            updateSelect()
        });
    }
    if (!!document.querySelector('.input-genbastructure')) {
        let typeSelect = $('.input-genbastructure')
        $.get("/api/genbastructure", function (data) {
            typeSelect.prepend("<option value='' selected='selected'></option>");
            data.forEach(element => {
                typeSelect.append('<option value="' + element.el + '" data-id="' + element._id + '">' + element.el + '</option>')
            });
        });
    }
    if (!!document.querySelector('.input-worklaw')) {
        let typeSelect = $('.input-worklaw')
        $.get("/api/worklaw", function (data) {
            typeSelect.prepend("<option value='' selected='selected'></option>");
            data.forEach(element => {
                typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
            });
        });
    }
    if (!!document.querySelector('.input-buildingtype')) {
        let typeSelect = $('.input-buildingtype')
        $.get("/api/buildingtype", function (data) {
            typeSelect.prepend("<option value='' selected='selected'></option>");
            data.forEach(element => {
                typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
            });
        });
    }
    if (!!document.querySelector('.input-withdrawal')) {
        let typeSelect = $('.input-withdrawal')
        $.get("/api/withdrawal", function (data) {
            typeSelect.prepend("<option value='' selected='selected'></option>");
            data.forEach(element => {
                typeSelect.append('<option value="' + element.el + '">' + element.el + '</option>')
            });
        });
    }
    //UPDATE FORM FIELD
    setTimeout(() => {
        if (!!document.querySelector('#formGenba')) {
            let genbaID = getUrlParameter('genbaID')
            if (genbaID != 0) {
                $('#submit_genba').attr('data-action', '/api/edit/genba?elementTypeID=' + genbaID)
                $.get('/api/genba?elID=' + genbaID, function (element) {
                    SUA({ event: '現場編集ページ', detail: element.工事名 })
                    $.each($('#formGenba').find('input'), function () {
                        let name = $(this).attr('name')
                        let newVal = element[name]
                        $('input[name="' + name + '"]').val(newVal).change()
                    })
                    $.each($('#formGenba').find('select'), function () {
                        let name = $(this).attr('name')
                        let newVal = element[name]
                        $('select[name="' + name + '"]').val(newVal).change()
                    })
                    $.each($('#formGenba').find('textarea'), function () {
                        let name = $(this).attr('name')
                        let newVal = element[name]
                        $('textarea[name="' + name + '"]').val(newVal).change()
                    })

                })
            } else {
                SUA({ event: '新規現場ページ' })
                $('#submit_genba').attr('data-action', '/api/addone/genba')
            }
            $('#genbaDelete').attr('action', '/api/delete/genba?elementTypeID=' + genbaID)
        }
    }, 1000);

}
function formInitCompany() {

    if (!!document.querySelector('#formCompany')) {
        let nc = $('#formCompany #koushuCheckList input.form-check-input[value="その他"]').parent()
        $('#koushuCheckList').append(nc.clone())
        nc.remove()
    }
}
//SETTGIN COMPANY PAGE
function SettingsCompnayInit() {
    console.log({
        event: 'SettingsCompnayInit'
    })
    $.fn.autoKana('input[name="el"]', 'input[name="業社名kana"]');

    let companyID = getUrlParameter('companyID')
    if (!!document.querySelector(".table#company")) {
        SUA({ event: '業社一覧ページ' })
        let cSelector = $('.table#company')
        $.get("/api/company", function (data) {
            data = sortit(data, '業社名kana')
            for (let index = 0; index < data.length; index++) {
                let element = data[index]
                if (element.el) {
                    let col1 = element.el || ""
                    let col2 = element.sub || ""
                    let col3 = element['業社名kana'] || ""
                    if (Array.isArray(col2)) {
                        col2 = col2.filter(String)
                    }
                    cSelector.find('tbody').append('<tr class="clickable" data-link="/dashboard/settings/company?companyID=' + element._id + '"><td>' + col1 + '</td><td>' + col3 + '</td><td>' + col2 + '</td></tr>')
                }
            };
        });
    }
    //koushuCheckList
    if (!!document.querySelector('#koushuCheckList')) {
        $.get("/api/koushu", function (data) {
            data.forEach((element, index) => {
                if (element.el) {
                    $('#koushuCheckList').append('<div class="form-check col-3" ><input class="form-check-input" type="checkbox" name="sub" id="chckbox_' + element._id + '" value="' + element.el + '" data-id="' + element._id + '"><label class="form-check-label" for="chckbox_' + element._id + '">' + element.el + '</label></div>')
                }
            });
            if (companyID != 0) {
                $('#submit_company').attr('data-action', '/api/edit/company?elementTypeID=' + companyID)
                $.get('/api/company?elID=' + companyID + '&getGenba=true', function (result) {
                    if (result.company) {
                        const company = result.company;
                        SUA({ event: '業社編集ページ', detail: company.el })
                        if (company.sub) {
                            if (Array.isArray(company.sub)) {
                                company.sub.forEach(function (koushu) {
                                    $('#koushuCheckList').find('.form-check input[value="' + koushu + '"]').attr('checked', true)
                                })
                            } else {
                                $('#koushuCheckList').find('.form-check input[value="' + company.sub + '"]').attr('checked', true)
                            }
                        }
                        $.each($('#formCompany').find('input.form-control'), function () {
                            let name = $(this).attr('name')
                            let newVal = company[name]
                            $('input[name="' + name + '"]').val(newVal).change()
                        })
                        $.each($('#formCompany').find('select'), function () {
                            let name = $(this).attr('name')
                            let newVal = company[name]
                            $('select[name="' + name + '"]').val(newVal).change()
                        })
                        $.each($('#formCompany').find('textarea'), function () {
                            let name = $(this).attr('name')
                            let newVal = company[name]
                            $('textarea[name="' + name + '"]').val(newVal).change()
                        })
                        if(result.genba) {
                            let genbaContent = "";
                            for (let i = 0; i < result.genba.length; i++) {
                                genbaContent += '<a class="mr-5 text-nowrap" href="/dashboard/settings/genba?genbaID='+result.genba[i]._id+'">'+result.genba[i].工事名+'</a>';
                            }
                            $(".company-genba").html(genbaContent);
                        }
                    }
                })
            } else {
                SUA({ event: '新規業社ページ' })
                $('#submit_company').attr('data-action', '/api/addone/company')
            }
            $('#companyDelete').attr('action', '/api/delete/company?elementTypeID=' + companyID)
        })
    }
}
function submitData(el) {
    let formSelect = '#' + $(el).attr('data-value')
    let formAction = $(el).attr('data-action')
    let formRedirect = $(el).attr('data-redirect')
    let obj = {}
    $(formSelect).find('textarea').each(function () {
        obj[$(this).attr('name')] = $(this).val()
    })
    $(formSelect).find('select').each(function () {
        obj[$(this).attr('name')] = $(this).val()
    })
    $(formSelect).find('input').each(function () {
        if ($(this).hasClass('form-check-input')) {
            if ($(this).is(':checked')) {
                if (obj[$(this).attr('name')] != undefined) {
                    obj[$(this).attr('name')].push($(this).val())
                } else {
                    obj[$(this).attr('name')] = [$(this).val()]
                }
            }
        } else {
            obj[$(this).attr('name')] = $(this).val()
        }
    })
    /*
    console.log({
        event:'submitData',
        formSelect:formSelect,
        formAction:formAction,
        formRedirect:formRedirect,
        obj:obj,
    })
    */
    $.post(formAction, obj, function () {
        window.location.href = window.location.origin + formRedirect
    })
}
//SETTING USERS PAGE
function SettingsUsersInit() {
    if (!!document.querySelector('#userActivity')) {
        $(document).on('click', '.user-select, .nice-select.input-responsible .option', function () {
            $('#editUsers .card-body').hide()
            $('#editUsers .loading').show()
            $('#userActivity .display').hide()
            $('#userActivity .loading').show()
            let userID = $(this).attr('data-value')
            $.get('/api/users?elID=' + userID, function (result) {
                console.log({
                    event: 'click .user-select ',
                    userID: userID,
                    result: result
                })
                $('#editUsers form').attr('action', '/users/edit?userID=' + userID)
                $('#editUsers form input').each(function () {
                    if (result[$(this).attr('name')]) {
                        $(this).val(result[$(this).attr('name')]).change()
                        $(this).attr('placeholder', result[$(this).attr('name')]).change()
                    }
                })
                $('#editUsers form select').each(function () {
                    if (result[$(this).attr('name')]) {
                        $(this).val(result[$(this).attr('name')]).change()
                        $(this).attr('value', result[$(this).attr('name')])
                        $(this).niceSelect('update')
                    }
                })
                //genbaCheckList
                if (!!document.querySelector('#genbaCheckList')) {
                    if ($('#genbaCheckList').hasClass('done')) {
                        $('#genbaCheckList').find('.form-check input').each(function () {
                            $(this).attr('checked', false)
                        })
                        if (result) {
                            if (result.genba) {
                                if (!Array.isArray(result.genba)) {
                                    result.genba = result.genba.split(' ')
                                }
                                result.genba.forEach(function (genba) {
                                    $('#genbaCheckList').find('.form-check input[value="' + genba + '"]').attr('checked', true)
                                })
                            }
                        }
                    } else {
                        $.get("/api/genba", function (data) {
                            data.forEach((element, index) => {
                                if (element.工事名) {
                                    $('#genbaCheckList').append('<div class="form-check col-3" ><input class="form-check-input" type="checkbox" name="genba" id="chckbox_' + element._id + '" value="' + element.工事名 + '" data-id="' + element._id + '"><label class="form-check-label" for="chckbox_' + element._id + '">' + element.工事名 + '</label></div>')
                                }
                            });
                            $('#genbaCheckList').addClass('done')
                            if (result) {
                                if (result.genba) {
                                    if (!Array.isArray(result.genba)) {
                                        result.genba = result.genba.split(' ')
                                    }
                                    result.genba.forEach(function (genba) {
                                        $('#genbaCheckList').find('.form-check input[value="' + genba + '"]').attr('checked', true)
                                    })
                                }
                            }
                        })

                    }
                }
                //Delete button
                if (!!document.querySelector('#usersDelete')) {
                    $('#usersDelete').attr('action', '/users/delete?userID=' + userID)
                }

                $('#editUsers .loading').hide()
                $('#editUsers .card-body').show()
            })
            $.get('/api/userinfo', function (results) {
                $('#userActivity ul.activity').html('')
                let datas = []
                results.forEach(element => {
                    if (element.userID == userID) {
                        datas.push(element)
                    }
                });
                //console.log(datas)
                let list_content_item = ''
                let options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                }
                let yesterday_ref = new Date(moment(new Date()).subtract(1, 'days').format()).toLocaleDateString('ja-JP', options)
                let today_ref = new Date().toLocaleDateString('ja-JP', options)
                let track = []
                datas.forEach((data, n) => {
                    if ((data['todayJP'] == today_ref) || (data['todayJP'] == yesterday_ref)) {
                        if (!document.querySelector('.list-group-item[data-value="' + data['todayJP'] + '"]')) {
                            let header_content = ''
                            header_content += '<li class="list-group-item bg-transparent border-0 p-0 mb-2" data-id="' + data._id + '" data-value="' + data['todayJP'] + '">'
                            header_content += '<div class="col-12 rounded-0 p-3" style="font-size: 31px;">' + data['todayJP'] + '</div>'
                            header_content += '</li>'
                            $('#userActivity ul.activity').append(header_content)
                        }
                        let xtime = new Date(data._date).getHours() + ':' + new Date(data._date).getMinutes()
                        list_content_item += '<div class="list_container row px-3 py-2 border rounded-0 m-0 bg-white" data-time="' + xtime + '" data-value="' + n + '">'
                        list_content_item += '<h5 class="col-12">' + data.event + '</h5>'
                        if (data.detail != undefined) {
                            list_content_item += '<p class="col-12" style="font-size: 13px;">' + data.detail + '</p>'
                        }
                        list_content_item += '<span data-feather="monitor"></span><span class="col">' + data.ww + '(横幅)</span>'
                        list_content_item += '<span data-feather="monitor"></span><span class="col">' + data.wh + '(縦幅)</span>'
                        list_content_item += '<span data-feather="clock"></span><span class="col">' + xtime + '</span>'
                        list_content_item += '</div>'

                        $('#userActivity ul.activity .list-group-item[data-value="' + data['todayJP'] + '"]').append(list_content_item)
                        track.push(data._id)
                    }
                });
                if (track.length == 0) {
                    $('#userActivity ul.activity').append('<span class="text-secondary text-center m-4" style="font-size:21px">データがございません。</span>')
                }
                $('#userActivity .display').show()
                $('#userActivity .loading').hide()
            })
        })
    }
    if (!!document.querySelector('#editUsers')) {
        let userID = $('#userID').attr('data-value')
        $.get('/api/users?elID=' + userID, function (result) {
            $('#editUsers form').attr('action', '/users/edit?userID=' + userID)
            $('#editUsers form input').each(function () {
                if (result[$(this).attr('name')]) {
                    $(this).val(result[$(this).attr('name')]).change()
                    $(this).attr('placeholder', result[$(this).attr('name')]).change()
                }
            })
            $('#editUsers form select').each(function () {
                if (result[$(this).attr('name')]) {
                    $(this).val(result[$(this).attr('name')]).change()
                    $(this).attr('value', result[$(this).attr('name')])
                    $(this).niceSelect('update')
                }
            })
            //genbaCheckList
            if (!!document.querySelector('#genbaCheckList')) {
                if ($('#genbaCheckList').hasClass('done')) {
                    $('#genbaCheckList').find('.form-check input').each(function () {
                        $(this).attr('checked', false)
                    })
                    if (result) {
                        if (result.genba) {
                            if (!Array.isArray(result.genba)) {
                                result.genba = result.genba.split(' ')
                            }
                            result.genba.forEach(function (genba) {
                                $('#genbaCheckList').find('.form-check input[value="' + genba + '"]').attr('checked', true)
                            })
                        }
                    }
                } else {
                    $.get("/api/genba", function (data) {
                        data.forEach((element, index) => {
                            if (element.工事名) {
                                $('#genbaCheckList').append('<div class="form-check col-3" ><input class="form-check-input" type="checkbox" name="genba" id="chckbox_' + element._id + '" value="' + element.工事名 + '" data-id="' + element._id + '"><label class="form-check-label" for="chckbox_' + element._id + '">' + element.工事名 + '</label></div>')
                            }
                        });
                        $('#genbaCheckList').addClass('done')
                        if (result) {
                            if (result.genba) {
                                if (!Array.isArray(result.genba)) {
                                    result.genba = result.genba.split(' ')
                                }
                                result.genba.forEach(function (genba) {
                                    $('#genbaCheckList').find('.form-check input[value="' + genba + '"]').attr('checked', true)
                                })
                            }
                        }
                    })

                }
            }
            //Delete button
            if (!!document.querySelector('#usersDelete')) {
                $('#usersDelete').attr('action', '/users/delete?userID=' + userID)
            }

            $('#editUsers .loading').hide()
            $('#editUsers .card-body').show()
        })
    }
}
//SETTING UPDATE
function SettingsUpdate() {
    $('.sortable').each(function () {
        let cList = $(this).attr('id')
        $('#' + cList).sortable({
            animation: 150,
            ghostClass: 'bg-success',
            stop: function (event, ui) {
                var order = $('#' + cList).sortable("toArray");
                console.log({
                    event: 'SettingsUpdate -> sortable',
                    order: order
                })
            }
        });
    })
    $('.addItemToggle').on('click', function () {
        let myId = $(this).attr('data-id')
        $('#' + myId + ' .addItemToggle').hide()
        $('#' + myId + ' .addItem').fadeIn(500)
    })
    /*
    $('.enableSetting').on('click',function(){
        let myId = $(this).attr('data-id')
        if( $('.removeGroup[data-id="'+myId+'"]').length > 0){
            $('#'+myId+' .explain')
            $('#'+myId+' .settingOptions').toggle()
            $('#'+myId+' ul.list-group input').each(function(){
                $(this).prop('readonly',function(idx, oldProp) {
                    return !oldProp;
                });
            })
        }
    })
    $('.removeGroup').on('click',function(){
        let factionDelete = $(this).closest('form').attr('action').replace('editAll','delete')
        let elementTypeID = $(this).attr('data-value')
        $(this).closest('form').attr('action',factionDelete+'?elementTypeID='+elementTypeID)
        $(this).closest('form').submit()
        setTimeout(() => {
            updateTotalTime()
        }, 1000);
    })
    */
}
//GLOBAL SETTING
function SettingsGlobal() {
    $('body').on('input propertychange change', 'form', function () {
        let result = {}
        $(this).find('input').each(function () {
            result[$(this).attr('name')] = $(this).val()
        })
        $(this).find('select').each(function () {
            result[$(this).attr('name')] = $(this).val()
        })
        $(this).find('textarea').each(function () {
            result[$(this).attr('name')] = $(this).val()
        })
        $.get('/api/globalsetting', function (setting) {
            if ($(this).attr('id', '#shimebi')) {
                result = Object.assign({}, result, currentPeriod(result.period));
                displayPeriodList(result.period)
            }
            if (setting[0]) {
                $.post('/api/update/globalsetting?elementTypeID=' + setting[0]._id, result)
            } else {
                $.post('/api/addone/globalsetting/', result)
            }
        })
        console.log({
            event: 'SettingsGlobal',
            result: result
        })
    })
    $.get("/api/globalsetting", function (data) {
        if (data[0]) {
            $('#SettingsGlobal select').each(function () {
                $(this).val(data[0][$(this).attr('name')])
            })
            displayPeriodList(data[0].period)
        }
    });

}
function updateGlobalSetting(period_start, period_end) {
    let date = new Date()
    $.get("/api/globalsetting", function (data) {
        if (data[0]) {
            if (new Date(data[0].period_end) < date) {
                let newPeriod = currentPeriod(data[0].period)
                $.post('/api/update/globalsetting?elementTypeID=' + data[0]._id, newPeriod)
                console.log({
                    event: 'updateGlobalSetting',
                    period_end: data[0].period_end,
                    date: date,
                    newPeriod: newPeriod
                })
            }
        }
    });
}
function displayPeriodList(period) {
    console.log({
        event: 'displayPeriodList',
        period: period
    })
    if ((period == undefined) || (isNaN(period))) {
        $.get("/api/globalsetting", function (data) {
            shimebi = parseInt(data[0].period)
            mainPeriodList(shimebi)
        })
    } else {
        shimebi = parseInt(period)
        mainPeriodList(shimebi)
    }
    $('select.period-list.globalselector').find('option:checked').prop('selected', true).change()

    function mainPeriodList(shimebi) {
        console.log({
            event: 'mainPeriodList',
            shimebi: shimebi
        })
        let date = new Date()
        $('.period-list').html('')
        for (let i = -1; i <= 0; i++) {
            for (let month = 0; month <= 11; month++) {
                let period_start = new Date(date.getFullYear() + i, month, (shimebi + 1))
                let period_end = new Date(date.getFullYear() + i, month + 1, shimebi)
                /*
                console.log({
                    period_start:period_start.toLocaleDateString('ja-JP'),
                    period_end:period_end.toLocaleDateString('ja-JP'),
                    date:date.toLocaleDateString('ja-JP'),
                    moment:new Date(moment(date).add(10, 'days')._d).toLocaleDateString('ja-JP'),
                    c:(period_start <= date),
                })
                */
                if (period_start <= date) {
                    let d_period_start = period_start.getFullYear() + '年' + (period_start.getMonth() + 1) + '月' + (period_start.getDate()) + '日';
                    let d_period_end = period_end.getFullYear() + '年' + (period_end.getMonth() + 1) + '月' + (period_end.getDate()) + '日';
                    let s_period_start = (period_start.getMonth() + 1) + '/' + period_start.getDate() + '/' + period_start.getFullYear();
                    let s_period_end = (period_end.getMonth() + 1) + '/' + period_end.getDate() + '/' + period_end.getFullYear();
                    if (!!document.querySelector('#new_dashoboard_content')) {
                        if (date <= period_end) {
                            updateGlobalSetting(s_period_start, s_period_end);
                            $('.period-list').prepend('<option data-value="' + s_period_start + ' - ' + s_period_end + '" class="current-period" selected>' + d_period_start + ' - ' + d_period_end + '</option>')
                        } else {
                            $('.period-list').prepend('<option data-value="' + s_period_start + ' - ' + s_period_end + '" >' + d_period_start + ' - ' + d_period_end + '</option>')
                        }
                    } else {
                        if ((period_start <= date) && (date <= period_end)) { updateGlobalSetting(s_period_start, s_period_end); $('.period-list').prepend('<option data-value="' + s_period_start + ' - ' + s_period_end + '" class="current-period" selected>' + d_period_start + ' - ' + d_period_end + '</option>') } else { $('.period-list').prepend('<option data-value="' + s_period_start + ' - ' + s_period_end + '" >' + d_period_start + ' - ' + d_period_end + '</option>') }
                    }

                }
            }
        }

        //UPDATE ICHIRAN FROM SELECT
        $(document).on('change', '.period-list.globalselector', function () {
            console.log({ event: 'change .period-list.globalselector' })
            let selectID = null
            if (!!document.querySelector('.input-responsible.globalselector')) {
                selectID = $('.input-responsible.globalselector').val()
            } else {
                selectID = $('#userID').attr('data-value')
            }

            let start = $(this).find('option:checked').attr('data-value').substring(0, $(this).find('option:checked').attr('data-value').indexOf(' -'))
            let end = $(this).find('option:checked').attr('data-value').substring($(this).find('option:checked').attr('data-value').indexOf('-') + 1)
            if (!!document.querySelector('#nippoichiran.current')) {
                nippoIchiranInit(selectID, today, start, end)
            }
            if (!!document.querySelector('#genbaichiran.current')) {
                genbaIchiranInit(today, start, end)
            }
            //genbaIchiranEdit()
            //userLevelEdit()
        })
        $('select.period-list').niceSelect('update')
    }
}
function userLevelEdit() {
    if ($('#user-level').attr('data-value') != '1') {
        if (!$('select.period-list.globalselector').find('option:checked').hasClass('current-period')) {
            $(document).find('.edit-options').addClass('off')
            $(document).find('#nippoichiran select').prop('disabled', true)
            $(document).find('#nippoichiran input').prop('disabled', true)
        } else {
            if ($(document).find('.edit-options').hasClass('off')) {
                $(document).find('.edit-options').removeClass('off')
                $(document).find('#nippoichiran select').prop('disabled', false)
                $(document).find('#nippoichiran input').prop('disabled', true)
            }
        }
    }
    console.log({
        event: 'on change .period-list.globalselector',
        userlevel: $('#user-level').attr('data-value'),
    })
}
function genbaIchiranEdit() {
    if ($('#user-level').attr('data-value') != '1') {
        $(document).find('.ichiran[data-name="genbaichiran"] .removeThisIdHide').each(function () {
            let cUserID = $('#userID').attr('data-value')
            let xUserID = $(this).find('span[data-name="userName"]').attr('data-id')
            /*
            console.log({
                event:'genbaIchiranEdit',
                cUserID:cUserID,
                xUserID:xUserID,
                check:(cUserID != xUserID)
            })
            */
            if (cUserID != xUserID) {
                $(this).find('.edit-options').addClass('off')
                $(this).addClass('disabled')
                $(this).find('select').prop('disabled', true)
                $(this).find('input').prop('disabled', true)
            }
        })
    }
}
function currentPeriod(period) {
    let shimebi = parseInt(period)
    let date = new Date()
    for (let month = 0; month <= 11; month++) {
        let period_start = new Date(date.getFullYear(), month, (shimebi + 1))
        let period_end = new Date(date.getFullYear(), month + 1, shimebi)
        if ((period_start <= date) && (date <= period_end)) {
            period_start = (period_start.getMonth() + 1) + '/' + period_start.getDate() + '/' + period_start.getFullYear();
            period_end = (period_end.getMonth() + 1) + '/' + period_end.getDate() + '/' + period_end.getFullYear();
            return { period_start: period_start, period_end: period_end }
        }
    }
}
//LOGIN PAGE
function loginInit() {
    //HIDE NAVBAR
    if (!!document.querySelector('#loginForm')) {
        $('nav').hide()
        $('body').addClass('bg-white')
        $('main').addClass('bg-white')
    }
}
//FILTER GENBA ON TYPE
function filterFunction(el) {
    let val = $(el).val()
    let selector = $(el).prev('.nice-select')
    selector.find('.current').text(val)
    selector.addClass('open')
    if (val != '') {
        selector.find('.option').each(function () {
            if ($(this).text().indexOf(val) == -1) {
                if (!$(this).hasClass('d-none')) {
                    $(this).addClass('d-none')
                }
            } else {
                if ($(this).hasClass('d-none')) {
                    $(this).removeClass('d-none')
                }
            }
        });
    } else {
        selector.find('.option').each(function () {
            if ($(this).hasClass('d-none')) {
                $(this).removeClass('d-none')
            }
        });
    }
}
//UTILITIES
function resizeInput() {
    let el = $(document).find('.editor')
    el.addClass('w-100')
    //el.css('width',el.val().length +'ch')
}
function getTotal() {
    $('.total').each(function () {
        let $this = $(this)
        let select = $(this).attr('data-value')
        let name = $(this).attr('data-name')
        $(document).on('change input', '.' + name + ' .' + select, function () {
            let total = 0
            $('.' + name + ' .' + select).each(function () {
                if ($.isNumeric($(this).val())) {
                    total += parseFloat($(this).val())
                }
            })
            /*
            console.log({
                event:'getTotal',
                select:select,
                name:name,
                total:total
            })
            */
            $this.html(total)
        })
    })
}
function miniTools() {
    setNippoView()
    $('.s-el[aria-labelledby="' + $('.nav-link.active').attr('id') + '"]').show()

    $('button[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $('.s-el[aria-labelledby="' + $(e.target).attr('id') + '"]').show().addClass('current')
        $('.s-el[aria-labelledby="' + $(e.relatedTarget).attr('id') + '"]').hide().removeClass('current')
    })

    $(document).on('click', '.showall', function () {
        $('.' + $(this).attr('data-ms-base')).show()
    })
    searchableTable()
    $('#user-nav-tab .nav-link').on('click', function () {
        $.cookie('userSettingView', $(this).attr('aria-controls'), { expires: 7 })
    })
    if ($.cookie('userSettingView') != undefined) {
        $('#' + $.cookie('userSettingView') + '-tab').click()
    }
    $('#listUsers li').on('click', function () {
        $('#listUsers li').each(function () {
            $(this).removeClass('on')
        })
        $(this).addClass('on')
        $.cookie('userSettingSelected', $(this).attr('data-value'), { expires: 7 })
    })
    if ($.cookie('userSettingSelected') != undefined) {
        $('#listUsers li[data-value="' + $.cookie('userSettingSelected') + '"]').click()
    }
    datecontrol()
    getTotal()
    genbaOptionSelect()
    $(document).on('click', '#genbaichiran .locked', function () {
        let cUserName = $('#lname').text() + ' ' + $('#fname').text()
        let xUserName = $(document).find('.removeThisIdHide[data-id="' + $(this).attr('data-id') + '"][data-value="' + $(this).attr('data-value') + '"]').find('span[data-name="userName"]').text()
        alert(cUserName + 'としてログインしているため' + xUserName + '様の項目は編集できません。')
    })
    $(document).on('click', '#nippoichiran .locked', function () {
        alert('前の期間を編集することはできません。')
    })
    //WIDTH OF INPUT
    /*
    $(document).on('input', 'input.editor', function() {
        $(this).css('width',$(this).val().length  +'ch')
    })
    */
    //HOVER TO EDIT
    $(document).on({
        mouseenter: function () {
            $(this).find('.settingOptions').show()
        },
        mouseleave: function () {
            $(this).find('.settingOptions').hide()
        }
    }, '.form-row')
    $(document).on({
        mouseenter: function () {
            $(this).find('.settingOptions').show()
        },
        mouseleave: function () {
            $(this).find('.settingOptions').hide()
        }
    }, 'li.list-group-item')
    $(document).on({
        mouseenter: function () {
            $(this).find('.removeThisId').show()
        },
        mouseleave: function () {
            $(this).find('.removeThisId').hide()
        }
    }, '.removeThisIdHide')
    //
    $(document).find('.input-genba-key').prev('.ipk.nice-select').find('.current').text('')
    //RESET SPECIFIC SELECT
    if (!!document.querySelector('#nippoEvery')) {
        $('body').on('click', '.reset', function () {
            let name = $(this).attr('name')
            $('select[name="' + name + '"]').val('').change()
            $('select[name="' + name + '"]').niceSelect('update')
        })
        $(document).on('input propertychange change', 'select', function () {
            let name = $(this).attr('name')
            if ($(this).val() != null) {
                $('.reset[name="' + name + '"]').show()
            } else {
                $('.reset[name="' + name + '"]').hide()
            }
        })
        $(document).on({
            mouseenter: function () {
                let name = $(this).prev().attr('name')
                if ($(this).prev().val() != null) {
                    $('.reset[name="' + name + '"]').show()
                }
            }
        }, '.nice-select')
    }

    //NICE SELECT UPDATE
    /*
    $(document).on('input propertychange change','form',function(){
        $(this).find('select').niceSelect('update')
    })
    $(document).on('input propertychange change','select',function(){
        $(this).niceSelect('update')
    })
    */
    $('body').on('click', '.clickable', function () {
        if ($(this).attr('data-link')) {
            window.location = new URL(window.location.origin + $(this).attr('data-link'))
        }
    })
    $('body').on('click', '.removeThisId', function () {
        let elementTypeID = $(this).attr('data-id')
        let elementTypeValue = $(this).attr('data-value')
        let elementType = $(this).attr('data-name')
        $('.removeThisIdHide[data-id="' + elementTypeID + '"][data-value="' + elementTypeValue + '"]').hide()
        console.log({
            elementTypeID: elementTypeID,
            elementTypeValue: elementTypeValue,
            elementType: elementType,
        })
        $.get('/api/' + elementType + '?elID=' + elementTypeID, function (result) {
            let ttl = parseInt(result.totalLine)
            if (ttl > 1) {
                ttl = (parseInt(result.totalLine) - 1)
                $.post('/api/replace/' + elementType + '?elementTypeID=' + elementTypeID, { totalLine: ttl })
                let keys = Object.keys(result)
                keys.forEach(key => {
                    if (key.indexOf('-' + elementTypeValue) >= 0) {
                        $.post('/api/editField/' + elementType + '?elementTypeID=' + elementTypeID, { [key]: '' })
                    }
                });
            } else {
                $.post('/api/delete/' + elementType + '?elementTypeID=' + elementTypeID)
            }

        })
    })
    $('body').on('click', '.editThisId', function () {
        let userID = $('.input-responsible.globalselector').val() || $('#userID').attr('data-value')
        let elementTypeID = $(this).attr('data-id')
        let elementTypeValue = $(this).attr('data-value')
        let elementType = $(this).attr('data-name')
        let elementQuery = $('.removeThisIdHide[data-id="' + elementTypeID + '"][data-value="' + elementTypeValue + '"]')
        console.log({
            event: 'editThisId',
            elementTypeID: elementTypeID,
            elementTypeValue: elementTypeValue,
            elementType: elementType,
        })
        editorCreate(['type', 'genba', 'time', 'personal', 'company', 'koushu'])
        function editorCreate(types) {
            types.forEach(type => {
                let sQuery = elementQuery.find('span[data-type="input-' + type + '"]')
                if (!!document.querySelector('span[data-type="input-' + type + '"]')) {
                    if (!sQuery.parent('td').hasClass('edit-on')) {
                        sQuery.parent('td').addClass('edit-on')
                        let s = {
                            query: sQuery,
                            type: type,
                            sVal: sQuery.text(),
                            sName: sQuery.attr('data-name'),
                            sData: sQuery.clone()
                        }
                        sQuery.hide()
                        //console.log(s)
                        sQuery.parent('td').append('<select style="display:none" data-type="input-' + type + '" data-field="' + s.sName + '" data-name="' + elementType + '" data-value="' + elementTypeValue + '" data-id="' + elementTypeID + '" data-userid="' + userID + '" class="editor input-' + type + ' px-2 bg-white border border-secondary rounded" placeholder="' + s.sVal + '" value="' + s.sVal + '" name="' + s.sName + '" onchange="updateField(this)"></select>');
                    } else {
                        sQuery.parent('td').removeClass('edit-on')
                        sQuery.show()
                        let crNs = sQuery.parent('td').find('.nice-select.editor .current').text()
                        if (crNs != '') { sQuery.text(crNs) } else { sQuery.text(sQuery.parent('td').find('.editor[data-type="input-' + type + '"]').attr('value')) }
                        sQuery.parent('td').find('.editor').remove()
                    }
                }
            });
        }
        //SUBJECT
        sQuery = elementQuery.find('span[data-type="input-subject"]')
        if (!sQuery.parent('td').hasClass('edit-on')) {
            sQuery.parent('td').addClass('edit-on')
            sQuery.hide()
            let s = {
                query: sQuery,
                sVal: sQuery.text(),
                sName: sQuery.attr('data-name'),
                sData: sQuery.clone()
            }
            //console.log(s)
            sQuery.parent('td').append('<input data-type="input-subject" data-field="' + s.sName + '" data-name="' + elementType + '" data-value="' + elementTypeValue + '" data-id="' + elementTypeID + '" data-userid="' + userID + '" class="editor px-2 py-2 bg-white border border-secondary rounded" type="text" placeholder="' + s.sVal + '" value="' + s.sVal + '" name="' + s.sName + '" onkeyup="updateField(this)" onclick="updateField(this)"/>')
        } else {
            sQuery.parent('td').removeClass('edit-on')
            sQuery.show()
            sQuery.text(sQuery.parent('td').find('.editor[data-type="input-subject"]').val())
            sQuery.parent('td').find('.editor').remove()
        }
    })
    if (!!document.querySelector('.switchview')) {
        let switchview = $.cookie('switchview');
        if (switchview == undefined) {
            $.cookie('switchview', $('.switchview .switcher.on').attr('data-value'), { expires: 7 });
            $('.' + $('.switchview .switcher.on').attr('data-value')).show()
        } else {
            $('.switchview .switcher').each(function () {
                $(this).removeClass('on')
            })
            $('.switchview .switcher[data-value="' + switchview + '"]').addClass('on')
            $('.switchview .switcher').each(function () {
                if ($(this).hasClass('on')) {
                    $(this).show()
                    $('.' + $(this).attr('data-value')).show()
                    $.cookie('switchview', $(this).attr('data-value'), { expires: 7 });
                } else {
                    $(this).hide()
                }
            })
        }
        $('.switchview').on('click', function () {
            $('.display').hide()
            $('.switchview .switcher').each(function () {
                $(this).toggleClass('on')
                if ($(this).hasClass('on')) {
                    $(this).show()
                    $('.' + $(this).attr('data-value')).show()
                    $.cookie('switchview', $(this).attr('data-value'), { expires: 7 });
                    let view = $(this).attr('data-value')
                    if (view == 'view-list') {
                        view = 'リスト表示に'
                    } else {
                        view = '日付表示に'
                    }
                    SUA({ event: '表示切り替え', detail: view })
                } else {
                    $(this).hide()
                }
            })
        })
    }
}

function updateField(el) {
    let val = $(el).val()
    let elementTypeID = $(el).attr('data-id')
    //let elementTypeValue = $(el).attr('data-value')
    let elementType = $(el).attr('data-name')
    let field = $(el).attr('data-field')
    console.log({
        event: 'updateField',
        val: val,
        field: field,
        elementTypeID: elementTypeID,
        // elementTypeValue:elementTypeValue,
        elementType: elementType,
    })

    $.post('/api/update/' + elementType + '?elementTypeID=' + elementTypeID, { [field]: val })

}
function navigationActive() {
    if (!!document.querySelector('a.nav-link')) {
        let curPAth = window.location.href
        let pageTitle = $('h3.title').text()
        let res = []
        $.each($('a.nav-link'), function () {
            let navlink = $(this).attr('href')
            let navText = $(this).text()
            if (navText == pageTitle) {
                $(this).addClass('active')
                $(this).parent().css('background-color', 'rgba(255, 255, 255, 0.23)')
            }
            if (curPAth.indexOf(navlink) >= 0) {
                res.push($(this))
            }
        })
        /*
        if(res.length > 0){
            res[res.length-1].addClass('active')
            res[res.length-1].parent().css('background-color','rgba(255, 255, 255, 0.23)')
        }
        */

    }
    $('h3.title').each(function () {
        $(this).html('<a href="' + window.location.href + '">' + $(this).text() + '</a>')
    })
}
function updateDate(el) {
    if (!el) {
        $.each($('.updateDate'), function () {
            let oldDate = $(this).text()
            let month = oldDate.substring(0, oldDate.indexOf('/'))
            let day = oldDate.substring(oldDate.indexOf('/') + 1, oldDate.lastIndexOf('/'))
            let year = oldDate.substring(oldDate.lastIndexOf('/') + 1)
            let today = year + '年' + month + '月' + day + '日'
            $(this).text(today)
        })
        $.each($('.getHours'), function () {
            let hours = new Date($(this).text()).getHours()
            let minutes = new Date($(this).text()).getMinutes()
            let second = new Date($(this).text()).getSeconds()
            let today = hours + ':' + minutes + ':' + second
            $(this).text(today)
        })
    } else {
        let hours = new Date($(el).text()).getHours()
        let minutes = new Date($(el).text()).getMinutes()
        let second = new Date($(el).text()).getSeconds()
        let today = hours + ':' + minutes + ':' + second
        $(el).text(today)
    }

}
function updateUserInfo() {
    if (!!document.querySelector('.responsible')) {
        console.log({
            event: 'updateUserInfo'
        })
        $('.input-userID').val($('#userID').attr('data-value'))
        $('.input-userName').val($('#lname').text() + ' ' + $('#fname').text())
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
                            if (index > 0) { $this.append('<span>, </span>') }
                            $this.append('<span class="user">' + user.lname + ' ' + user.fname + '</span>')
                            $this.show()
                        }
                    })
                }, tt);
                tt += 100
            }
        })
    }
}
function updateUserInfoOnly() {
    $('body').find('.responsible').each(function () {
        let ids = $(this).text().split(',')
        let $this = $(this)
        $this.text('')
        var tt = 0
        for (let i = 0; i < ids.length; i++) {
            setTimeout(() => {
                let userID = ids[i]
                let index = i
                $.get('/users/info/' + userID, function (user) {
                    if (user) {
                        if (index > 0) { $this.append('<span>, </span>') }
                        $this.append('<span class="user">' + user.lname + ' ' + user.fname + '</span>')
                    }
                })
            }, tt);
            tt += 100
        }
    })
}
function adminOnly() {
    let level = $('#user-level').attr('data-value')
    if (level == 1) {
        $(document).find('.adminOnly').show()
    } else {
        $(document).find('.notAdmin').show()
    }
}
function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};
function updateListGlobalSelector(el, userID) {
    if (el == 'nippo') {
        el = 'form.nippo .input-genba'
    } else {
        el = '.input-genba.globalselector[data-name="' + el + '"]'
    }
    console.log({
        event: 'updateListGlobalSelector',
        el: el,
        name: $(el).attr('data-name') || 'no selector founded',
    })

    $(el).each(function () {
        let genbaSelect = $(this)
        genbaSelect.niceSelect('destroy')
        $(this).attr('data-userid', userID)
        $.get('/users/info/' + userID, function (user) {
            if (user && (user.genba)) {
                if (user.genba.length > 0) {
                    $.get("/api/genba", function (data) {
                        genbaSelect.html('')
                        data.forEach(element => {
                            if (element.工事名 && (user.genba.includes(element.工事名) == true)) {
                                genbaSelect.append('<option value="' + element.工事名 + '" data-id="' + element._id + '">' + element.工事名 + '</option>')
                            }
                        });
                        if (!genbaSelect.hasClass('globalselector')) {
                            genbaSelect.val('')
                            if (!genbaSelect.attr('value')) {
                                genbaSelect.val('')
                            } else {
                                genbaSelect.val(genbaSelect.attr('value'))
                            }
                            genbaSelect.niceSelect('update')
                        }
                    });
                }
            } else {
                $.get("/api/genba", function (data) {
                    data.forEach(element => {
                        if (element.工事名) {
                            genbaSelect.append('<option value="' + element.工事名 + '" data-id="' + element._id + '">' + element.工事名 + '</option>')
                        }
                    });
                    if (!genbaSelect.hasClass('globalselector')) {
                        genbaSelect.val('')
                        if (!genbaSelect.attr('value')) {
                            genbaSelect.val('')
                        } else {
                            genbaSelect.val(genbaSelect.attr('value'))
                        }
                        genbaSelect.niceSelect('update')
                    }
                });
            }
        })

    })
}
function inputInit(callback) {
    console.log({
        event: 'inputInit'
    })
    loadinput(['koushu', 'type', 'place', 'company'])
    function loadinput(types) {
        for (let i = 0; i < types.length; i++) {
            let type = types[i]
            if (!!document.querySelector('select.input-' + type)) {
                $(document).find('select.input-' + type).each(function () {
                    let sl = $(this)
                    $.get("/api/" + type, function (data) {
                        sl.html('')
                        if (data.length > 0) {
                            data = sortit(data)
                            data.forEach(element => {
                                sl.append('<option value="' + element.el + '">' + element.el + '</option>')
                            });
                            if (!sl.attr('value')) {
                                sl.val('')
                            } else {
                                sl.val(sl.attr('value'))
                            }
                            let nc = sl.find('option[value="その他"]')
                            sl.append(nc.clone())
                            nc.remove()
                        }
                        sl.niceSelect('update')
                    });
                })
            }
        }
    }
    if (!!document.querySelector('.input-time')) {
        $('select.input-time').html('')
        $('select.input-time').each(function () {
            if ($(this).find('option').length == 0) {
                $(this).append('<option value="1.0">1.0</option>')
                $(this).append('<option value="0.75">0.75</option>')
                $(this).append('<option value="0.5">0.5</option>')
                $(this).append('<option value="0.25">0.25</option>')
                $(this).append('<option value="0.0">0.0</option>')
                if (!$(this).attr('value')) {
                    $(this).val('')
                } else {
                    $(this).val($(this).attr('value'))
                }
            }
            $(this).niceSelect('update')
        })
    }
    if (!!document.querySelector('.input-genba')) {
        let userIDs = []
        $(document).find('select.input-genba').each(function () {
            if (!$(this).hasClass('init-on')) {
                let userID = $(this).attr('data-userid')
                if ((userIDs.includes(userID) == false) && (userID != undefined)) {
                    userIDs.push(userID)
                }
            }
        })

        console.log({
            event: 'inputInit -> genba',
            userIDs: userIDs
        })

        if (userIDs.length == 0) { genbaInit($(document).find('select.input-genba')) }
        userIDs.forEach(userID => {
            let allSelect = $(document).find('select.input-genba[data-userid="' + userID + '"]')
            $.get('/users/info/' + userID, function (user) {
                /*
                console.log({
                    event:'inputInit -> genba',
                    userID:userID,
                    user:user
                })
                */
                let yesterday = moment(new Date($('.input-date.globalselector').data('date'))).subtract(1, 'days')._d
                let dd = new Date(yesterday)
                let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();

                let genbaYesterday;
                let genbaYesterdayIDs;
                $.get('/api/genba/today' + userID + '?today=' + ct, function (result) {
                    console.log({
                        event: 'genbaYesterday',
                        userID: userID,
                        yesterday: ct,
                        result: result,
                    })
                    // Set a variable in local storage
                    localStorage.setItem(`genbaYesterday-${userID}-${ct}`, JSON.stringify(result));

                    // Retrieve and parse the string back to an object
                    genbaYesterday = JSON.parse(localStorage.getItem(`genbaYesterday-${userID}-${ct}`));
                    genbaYesterdayIDs = genbaYesterday.map(obj => obj.genbaID);


                    if (user && (user.genba)) {
                        if (user.genba.length > 0) {
                            $.get("/api/genba", function (data) {
                                allSelect.each(function () {
                                    let genbaSelect = $(this)
                                    genbaSelect.html('')
                                    data = sortit(data, '工事名kana')
                                    for (let index = 0; index < data.length; index++) {
                                        let element = data[index]
                                        if (element.工事名 && (user.genba.includes(element.工事名) == true)) {
                                            if (genbaYesterdayIDs.includes(element._id)) {
                                                genbaSelect.prepend('<option value="' + element.工事名 + '" data-id="' + element._id + '">' + element.工事名 + '</option>')
                                            } else {
                                                genbaSelect.append('<option value="' + element.工事名 + '" data-id="' + element._id + '">' + element.工事名 + '</option>')
                                            }
                                        }
                                    };
                                    if (!genbaSelect.hasClass('globalselector')) {
                                        //genbaSelect.val('')
                                        if (!genbaSelect.attr('value')) {
                                            genbaSelect.val('')
                                        } else {
                                            genbaSelect.val(genbaSelect.attr('value'))
                                        }
                                    } else {
                                        if (!genbaSelect.hasClass('init-on')) {
                                            genbaSelect.addClass('init-on')
                                            let selectid = 0
                                            if (getUrlParameter('selectid') != undefined) {
                                                selectid = getUrlParameter('selectid')
                                            }
                                            console.log({
                                                event: 'inputInit -> genba',
                                                selectid: selectid
                                            })
                                            if ((selectid == 0) || selectid == undefined) {
                                                genbaSelect.val(genbaSelect.find("option:first").val()).change();
                                            } else {
                                                genbaSelect.val(genbaSelect.find('option[data-id="' + selectid + '"]').val()).change();
                                            }
                                        }
                                    }
                                    genbaSelect.niceSelect('update')
                                })
                            });
                        }
                    } else {
                        genbaInit(allSelect)
                    }
                })


            })
        });
    }
    function genbaInit(allSelect) {
        console.log({
            event: 'genbaInit',
            allSelect: allSelect
        })
        allSelect.each(function () {
            let genbaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/genba", function (data) {
                    data = sortit(data, '工事名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.工事名) {
                            genbaSelect.append('<option value="' + element.工事名 + '" data-id="' + element._id + '">' + element.工事名 + ' </option>')
                        }
                    };
                    if (!genbaSelect.hasClass('globalselector')) {
                        genbaSelect.val('')
                        if (!genbaSelect.attr('value')) {
                            genbaSelect.val('')
                        } else {
                            genbaSelect.val(genbaSelect.attr('value'))
                        }
                        genbaSelect.niceSelect('update')
                    } else {
                        if (!genbaSelect.hasClass('init-on')) {
                            genbaSelect.addClass('init-on')
                            genbaSelect.val(genbaSelect.find("option:first").val()).change();
                        }
                    }
                });
            }
        })
    }
    if (callback) { callback() }
}
function initGlobalSelector() {
    if (!!document.querySelector('.input-responsible')) {
        let userID = $('#userID').attr('data-value')
        if (getUrlParameter('selectid') != undefined) {
            userID = getUrlParameter('selectid')
        }
        $('select.input-responsible').html('')
        $.get("/api/users", function (data) {
            data.forEach(element => {
                let selected = ''
                if (userID == element._id) { selected = 'selected' }
                $('select.input-responsible').append('<option value="' + element._id + '" ' + selected + ' >' + element.lname + ' ' + element.fname + '</option>')
            });
            $('select.input-responsible').niceSelect('update')
        });
    }

    //UPDATE DATE FROM SELECT & RESET FORM & INIT ENTRIES
    let startDate = null
    if ($('#user-level').attr('data-value') != 1) {
        startDate = new Date($('#start-period').attr('data-value'))
    }
    if (!!document.querySelector('.input-date.globalselector')) {

        let userID = $('#userID').attr('data-value')
        let start = $('#start-period').attr('data-value')
        let end = $('#end-period').attr('data-value')
        $.get('/api/nippoichiran?userID=' + userID + '&today=' + today + '&start=' + start + '&end=' + end, function (nippoichiran) {
            $('.input-date.globalselector').datepicker({
                language: "ja",
                format: 'yyyy年mm月dd日 (D)',
                autoclose: true,
                startDate: startDate,
                endDate: new Date(),
                beforeShowDay: function (date) {
                    return nippoCalendar(date, nippoichiran)
                }
            }).on('changeDate', function (e) {
                let dd = new Date(e.date)
                let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
                let options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                }
                const dJP = dd.toLocaleDateString('ja-JP', options)
                let selectID = $(this).attr('data-name')
                console.log({
                    event: 'changeDate',
                    dd: dd,
                    ct: ct,
                    dJP: dJP,
                    name: selectID
                })
                SUA({ event: '日報入力ページ', detail: '「日付」を変更して' + dJP + 'へ' })
                let userID = $('.input-responsible.globalselector[data-name="' + selectID + '"]').val()
                $('.input-date.globalselector').val(dJP)
                isweekendClass($('.input-date.globalselector'))
                $('.input-date.globalselector').addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
                $('.input-date.globalselector').attr('data-date', ct)
                $('form').find('.input-date').val(ct)
                genbatoday(userID, ct)
                datecontrol();
                resetGroupForm()
                if (userID != null) {
                    initFormField(userID, ct)
                } else {
                    $.get('/api/db/userid', function (result) {
                        let userID = result
                        initFormField(userID, ct)
                    })
                }
            })
        })
        //FIRST INITIALISE DATE
        if (getUrlParameter('y') != undefined && getUrlParameter('y')) {
            const year = getUrlParameter('y')
            const month = getUrlParameter('m')
            const date = getUrlParameter('d')
            const fullDay = `${month}/${date}/${year}`;
            let dd = new Date(fullDay)
            let options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short',
            }
            const dJP = dd.toLocaleDateString('ja-JP', options)
            $('.input-date.globalselector').val(dJP)
            $('.input-date.globalselector').attr('data-date', fullDay)
            $('.input-date.globalselector').addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
        } else {
            $('.input-date.globalselector').val(todayJP)
            $('.input-date.globalselector').attr('data-date', today)
            $('.input-date.globalselector').addClass('isweekend-' + todayJP.substring(todayJP.indexOf('(')).replace('(', '').replace(')', ''))
        }

    }

}
//LINK COMPANY AND KOUSHU
function linkSelect(el) {
    let num = $(el).closest('.form-group').attr('data-value')
    let value = $(el).val()
    let inputCompany = $(document).find('.input-company[name="業社名-' + num + '"]')
    let compnayValue = inputCompany.val()
    if (!!document.querySelector('.input-temp[data-name="業社名-' + num + '"]')) { $('.input-temp[data-name="業社名-' + num + '"]').remove() }
    if (value != null) {
        $.get('/api/company', function (results) {
            let result = []
            let content = '<select class="input-temp text-center w-100" data-input="input-company" data-name="業社名-' + num + '" style="display:none;font-size: 11px;" value="' + compnayValue + '" onchange="inputTemp(this)">'
            results.forEach(element => {
                if (element.sub != undefined) {
                    if ((!Array.isArray(element.sub))) {
                        element.sub = element.sub.split(' ')
                    }
                    if (element.sub.includes(value) == true) {
                        result.push(element.el)
                        let checking = ''; if (compnayValue == element.el) { checking = 'selected' }
                        content += '<option value="' + element.el + '" ' + checking + '>' + element.el + '</option>'
                    }
                }
            });
            content += '</select>'
            if (!inputCompany.attr('value')) {
                inputCompany.val(result[0])
            }
            inputCompany.hide()
            inputCompany.after(content)
            $('.input-temp[data-name="業社名-' + num + '"]').niceSelect('update')
            /*
            console.log({
                event:'linkSelect',
                num:num,
                value:value,
                compnayValue:compnayValue,
                result:result,
                inputCompany:inputCompany
            })
            */
        })
    } else {
        inputCompany.show()
        /*
        console.log({
            event:'linkSelect',
            num:num,
            value:value,
        })
        */
    }
}
function inputTemp(el) {
    let value = $(el).val()
    let name = $(el).attr('data-name')
    let inputSelect = $(el).attr('data-input')
    $('.' + inputSelect + '[name="' + name + '"]').val(value).change()
    console.log({
        event: 'inputTemp',
        value: value,
        name: name,
        inputSelect: inputSelect
    })
}
//SELECT DEFAULT OPTION
function genbaOptionSelect() {

    $('body').on('change', 'select.input-genba.globalselector', function () {
        if ($(this).attr('data-name') == 'genbanippo') {
            let genbaVal = $(this).val()
            $(this).find('option').each(function () {
                if ($(this).attr('value') == genbaVal) {
                    let genbaID = $(this).attr('data-id')
                    if (!!document.querySelector('#formPage')) {
                        let userID = null
                        if (!!document.querySelector('.input-responsible.globalselector')) {
                            userID = $('.input-responsible.globalselector').val()
                        } else {
                            userID = $('#userID').attr('data-value')
                        }
                        let cDate = $('.input-date.globalselector').attr('data-date')
                        console.log({
                            event: 'onChange .input-genba',
                            userID: userID,
                            cDate: cDate,
                            genbaVal: genbaVal,
                        })
                        resetGroupForm($('form.genbanippo'))
                        $('form.genbanippo .input-genbaID').val(genbaID)
                        $('form.genbanippo .input-genbaName').val(genbaVal)
                        initFormField(userID, cDate, 'genbanippo')
                        //update button ?SelectGenbaID
                        $('.SelectGenbaID').attr('data-selectid', genbaID)
                        $('.SelectGenbaID').attr('data-sua-detail', genbaVal + 'へ')
                    }
                }
            });
        }

        if (!!document.querySelector('#genbaichiran.current')) {
            console.log({
                event: 'onChange .input-genba',
                action: 'genbaIchiranInit',
            })
            genbaIchiranInit(today)
        }
    })
}

function sortit(arr, sel) {
    if (arr[0].el == undefined) { sel = '工事名kana' }
    arr.sort(function (a, b) {
        if (a[sel] && b[sel]) {
            a = katakanaToHiragana(a[sel].toString());
            b = katakanaToHiragana(b[sel].toString());
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
        } else {
            return -1;
        }
        return 0;
    });
    return arr
}

function katakanaToHiragana(src) {
    return src.replace(/[\u30a1-\u30f6]/g, function (match) {
        var chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
}
function genLinkandGo(el) {
    let info = {}
    let bs = $(el).attr('data-base')
    let id = $(el).attr('data-selectid')
    info.event = $(el).attr('data-sua-event')
    info.detail = $(el).attr('data-sua-detail') || '-'
    SUA(info, function () {
        if (bs.indexOf('?') >= 0) {
            window.location = bs + '&selectid=' + id
        } else {
            window.location = bs + '?selectid=' + id
        }
    })
}
$(document).on('keyup', '.decimal', function () {
    var val = $(this).val();
    if (isNaN(val)) {
        val = val.replace(/[^0-9\.]/g, '');
        if (val.split('.').length > 2) {
            val = val.replace(/\.+$/, "");
        }
    }
    if ((val.split('.').length > 1) && (val.split('.')[1].length > 1)) {
        console.log(val.split('.'))
        val = parseFloat(val).toFixed(1);
    }
    if (val > 20) {
        alert('人員が20人を超えました。')
    }
    $(this).val(val).change();
});
function SUA(info, callback) {
    let obj = { ww: $(window).width(), wh: $(window).height(), location_href: window.location.href }
    obj = Object.assign({}, obj, info)
    $.post('/api/userinfo', obj, function () {
        if (callback) {
            callback()
        }
    })
}
function triggerSUA(el) {
    let info = {}
    info.event = $(el).attr('data-sua-event') || $(el).attr('id') || '-'
    info.detail = $(el).attr('data-sua-detail') || '-'
    let obj = { ww: $(window).width(), wh: $(window).height(), location_href: window.location.href }
    obj = Object.assign({}, obj, info)
    $.post('/api/userinfo', obj, function () {
        if ($(el).attr('data-redirection')) {
            window.location.href = window.location.origin + $(el).attr('data-redirection')
        }
    })
}
function isweekendClass(el) {
    var classList = $(el).attr('class').split(/\s+/);
    $.each(classList, function (index, item) {
        if (item.indexOf('isweekend') >= 0) {
            $(el).removeClass(item)
        }
    });
}
function searchableTable() {
    $('.filter').keyup(function () {
        var rex = new RegExp($(this).val(), 'i');
        $('.' + $(this).attr('data-value') + ' tr').hide();
        $('.' + $(this).attr('data-value') + ' tr').filter(function () {
            return rex.test($(this).text());
        }).show();
    })
}
function makeSearch(el) {
    let key = $(el).attr('data-ms-key')
    let base = $(el).attr('data-ms-base')
    var rex = new RegExp(key, 'i');
    $('.' + base).hide();
    $('.' + base).filter(function () {
        return rex.test($(this).text());
    }).show();
    SUA({ event: 'フィルタ機能を使い', detail: key })
}
function constructFilter() {
    $(document).on('click', '.nice-select.constructFilter', function () {
        $(this).prepend('<div class="input-group position-absolute w-100" style="top: 0;left: 0;"><input class="form-control" data-value="list" placeholder="..." onkeyup="filterFunction(this)"></div>')
        feather.replace()
        $(this).removeClass('constructFilter')
    })
}
function filterFunction(el) {
    if (!$(el).closest('.nice-select').hasClass('open')) {
        $(el).closest('.nice-select').addClass('open')
    }
    var rex = new RegExp($(el).val(), 'i');
    $(el).closest('.nice-select').find('li.option').hide();
    $(el).closest('.nice-select').find('li.option').filter(function () {
        return rex.test($(this).text());
    }).show();
}
function setCookie(c_name, c_val) {
    $.cookie(c_name, c_val, { expire: 7 })
    let info = {}
    info.event = $('#' + c_val).attr('data-sua-event')
    info.detail = $('#' + c_val).attr('data-sua-detail') || '-'
    SUA(info)
}
function setNippoView() {
    if ($.cookie('nippoview') != undefined) {
        $('#nippoview').find('#' + $.cookie('nippoview')).click()
    }
}
// New Dashboard Page Init
function newDashboardCalendarInit(userID, today, start, end) {
    let altogetherWorkDays = 0;
    $("#calendar_nippo").html('<div class="months"><div class="month"><div class="days"><div class="day weekLabel weekd0" title="Sunday">日</div><div class="day weekLabel weekd1" title="Monday">月</div><div class="day weekLabel weekd2" title="Tuesday">火</div><div class="day weekLabel weekd3" title="Wednesday">水</div><div class="day weekLabel weekd4" title="Thursday">木</div><div class="day weekLabel weekd5" title="Friday">金</div><div class="day weekLabel weekd6" title="Saturday">土</div></div></div></div></div>');
    $.get('/api/nippoichiran?userID=' + userID + '&today=' + today + '&start=' + start + '&end=' + end, function (result) {
        let calendar = '<div class="months"><div class="month"><div class="days"><div class="day weekLabel weekd0" title="Sunday">日</div><div class="day weekLabel weekd1" title="Monday">月</div><div class="day weekLabel weekd2" title="Tuesday">火</div><div class="day weekLabel weekd3" title="Wednesday">水</div><div class="day weekLabel weekd4" title="Thursday">木</div><div class="day weekLabel weekd5" title="Friday">金</div><div class="day weekLabel weekd6" title="Saturday">土</div>';
        if (result) {
            let preStartPeriod = start.split("/")
            let preEndPeriod = end.split("/")
            const preStart = new Date(preStartPeriod[2], preStartPeriod[0] - 1, preStartPeriod[1]);
            const preEnd = new Date(preEndPeriod[2], preEndPeriod[0] - 1, preEndPeriod[1]);
            // const startPeriod = preStart.toISOString().replace("Z", "+02:00");
            // const endPeriod = preEnd.toISOString().replace("Z", "+02:00");
            const realStartDate = new Date(preStart);
            const realEndDate = new Date(preEnd);
            let startDate, endDate;
            const startDay = realStartDate.getDay();
            if (startDay === 0) {
                startDate = realStartDate;
            } else {
                if (realStartDate.getDate() <= startDay) {
                    const restDate = startDay - realStartDate.getDate() + 1;
                    const lastDateOfPreMonth = (new Date(realStartDate.getFullYear(), realStartDate.getMonth(), 0)).getDate();
                    startDate = new Date(realStartDate.getMonth() + "/" + (lastDateOfPreMonth - restDate) + "/" + realStartDate.getFullYear());
                } else {
                    startDate = new Date((realStartDate.getMonth() + 1) + "/" + (realStartDate.getDate() - startDay) + "/" + realStartDate.getFullYear());
                }
            }
            const endDay = realEndDate.getDay();
            if (endDay === 6) {
                endDate = realEndDate;
            } else {
                const lastDateOfThisMonth = (new Date(realEndDate.getFullYear(), (realEndDate.getMonth() + 1), 0)).getDate();
                if ((realEndDate.getDate() + 6 - endDay) > lastDateOfThisMonth) {
                    endDate = new Date((realEndDate.getMonth() + 2) + "/" + (6 - endDay) + "/" + realEndDate.getFullYear());
                } else {
                    endDate = new Date((realEndDate.getMonth() + 1) + "/" + (realEndDate.getDate() + 6 - endDay) + "/" + realEndDate.getFullYear());
                }
            }
            if (endDate < startDate) throw "Cannot render reversed calendar!";

            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();
            // const tzOffset = (new Date()).getTimezoneOffset() * 1000;

            const series = (start, end) => {
                const a = [];
                for (let i = start; i <= end; i++) a.push(i);
                return a;
            };
            for (let year of series(startYear, endYear)) {
                const fromMonth = year == startYear ? startDate.getMonth() : 0;
                const toMonth = year == endYear ? endDate.getMonth() : 11;

                for (let month of series(fromMonth, toMonth)) {
                    calendar += monthCreating(year, month, startDate, endDate, realStartDate, realEndDate, result);
                }
            }
        } else {
            calendar += '<div style="height:50%; width: 100%;">データなし</div>'
        }
        calendar += "</div></div></div></div>";
        $("#calendar_nippo").html(calendar);
        $(".work-days").text("出動 : " + altogetherWorkDays + "日")
    })
    function monthCreating(year, month, startDate, endDate, realStartDate, realEndDate, data) {
        let lastDay = new Date(year, month + 1, 0).getDate();
        if (month === endDate.getMonth()) lastDay = endDate.getDate();
        let startDayOfMixin = 1;
        if (month === startDate.getMonth()) startDayOfMixin = startDate.getDate();
        let divList = "";
        for (let d = startDayOfMixin; d <= lastDay; d++) {
            const currentDay = new Date(month + 1 + "/" + d + "/" + year);
            const wclass = "weekd" + currentDay.getDay();
            const isDisabled =
                currentDay < realStartDate || currentDay > realEndDate ? "disabled" : "";
            const classes = [wclass, isDisabled];
            let dayContent = d;
            let mainContent = [];
            let extraContent = "";

            if (
                year === realStartDate.getFullYear() &&
                month === realStartDate.getMonth() &&
                (d === realStartDate.getDate() || d === 1)
            ) {
                dayContent = month + 1 + "/" + d;
            }
            const currentWorkData = data.filter(item =>
                new Date(item.today).getFullYear() === year &&
                new Date(item.today).getMonth() === month &&
                new Date(item.today).getDate() === d
            )

            const day = document.createElement("a");
            if (
                year === date.getFullYear() &&
                (
                    month === date.getMonth() &&
                    (
                        month === realStartDate.getMonth() && d <= date.getDate() ||
                        month === realEndDate.getMonth() && (
                            d <= realEndDate.getDate() && realEndDate.getDate() <= date.getDate() ||
                            d <= date.getDate() && date.getDate() <= realEndDate.getDate()
                        )
                    ) ||
                    month < date.getMonth() && (
                        realStartDate.getMonth() === month && d >= realStartDate.getDate() ||
                        realEndDate.getMonth() === month && d <= realEndDate.getDate()
                    )
                ) ||
                year < date.getFullYear() &&
                (
                    month === realStartDate.getMonth() && d >= realStartDate.getDate() ||
                    month === realEndDate.getMonth() && d <= realEndDate.getDate()
                )
            ) {
                day.setAttribute("href", `/dashboard/input_nippo?y=${year}&m=${month + 1}&d=${d}`);

                if (!currentWorkData.length) {
                    mainContent = ["日報未入力"];
                    mainClass = "not-completed";
                    extraContent = "0日";
                } else {
                    if (currentWorkData[0].totalLine) {
                        for (let n = 1; n <= currentWorkData[0].totalLine; n++) {
                            let work = "";
                            if (currentWorkData[0]['作業内容-' + n]) {
                                work = currentWorkData[0]['作業内容-' + n].length > 6 ? `${currentWorkData[0]['作業内容-' + n].slice(0, 6)}...` : currentWorkData['作業内容-' + n];
                                mainContent.push(work)
                            }
                        }
                    }
                    mainClass = "completed";
                    if (currentWorkData[0].totalTime) {
                        let totalTime = 0
                        if ($.isNumeric(currentWorkData[0].totalTime) === true) {
                            altogetherWorkDays += Number(currentWorkData[0].totalTime);
                            totalTime = Number(currentWorkData[0].totalTime);
                        }
                        extraContent = `${totalTime}日`;
                    }
                }
            }


            day.className = classes.join(" day ");
            day.style.display = "grid";
            day.textContent = dayContent;
            const mainContentHtml = document.createElement("div")
            mainContentHtml.classList.add("work-history");
            for (const cc of mainContent) {
                const div = document.createElement("div");
                div.className = mainClass;
                div.textContent = cc;
                mainContentHtml.appendChild(div);
            }
            day.appendChild(mainContentHtml);
            const extraDiv = document.createElement("div");
            extraDiv.style.textAlign = "right";
            extraDiv.style.marginTop = "auto";
            extraDiv.style.marginBottom = "0";
            extraDiv.textContent = extraContent;
            day.appendChild(extraDiv);
            divList += day.outerHTML;
        }
        return divList;
    }
}

function newDashboardChartInit(chartNo, genba, start, end) {
    $("#genbaichart" + chartNo).text(genba.工事名);
    const genbaID = genba._id
    const stateDate = new Date(start);
    const endDate = new Date(end);
    let preData = {};
    let labels = [];
    let preDataSets = {};
    $.get('/api/genbaichiranDateRange?genbaID=' + genbaID + '&today=' + today + '&start=' + start + '&end=' + end, function (result) {
        if (result) {
            result.forEach(data => {
                for (let n = 1; n <= data.totalLine; n++) {
                    if (data) {
                        let col2 = data['業社名-' + n] || '-'
                        let col3 = data['人員-' + n] || '-'
                        if (!$.isNumeric(col3)) {
                            col3 = 0
                        }
                        let people = parseFloat(col3);
                        if (col2 !== '-') {
                            if (preData[col2]) {
                                preData[col2].push({ people, date: data.today })
                            } else {
                                preData[col2] = [{ people, date: data.today }];
                            }
                        }
                    }
                }
            });
            if (stateDate.getFullYear() === endDate.getFullYear()) {
                if (stateDate.getMonth() === endDate.getMonth()) {
                    labels = [...labels, ...getMonthArray(stateDate.getFullYear(), stateDate.getMonth(), stateDate.getDate(), endDate.getDate(), false)];
                } else {
                    for (let i = stateDate.getMonth(); i <= endDate.getMonth(); i++) {
                        if (i === stateDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, stateDate.getDate(), new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                        } else if (i === endDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, endDate.getDate(), false)];
                        } else {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                        }
                    }
                }
            } else {
                for (let j = stateDate.getFullYear(); j <= endDate.getFullYear(); j++) {
                    if (j === stateDate.getFullYear()) {
                        for (let i = stateDate.getMonth(); i <= 11; i++) {
                            if (i === stateDate.getMonth()) {
                                labels = [...labels, ...getMonthArray(j, i, stateDate.getDate(), new Date(j, i + 1, 0).getDate(), true)];
                            } else {
                                labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                            }
                        }
                    } else if (j === endDate.getFullYear()) {
                        for (let i = 1; i <= endDate.getMonth(); i++) {
                            if (i === endDate.getMonth()) {
                                labels = [...labels, ...getMonthArray(j, i, 1, endDate.getDate(), true)];
                            } else {
                                labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                            }
                        }
                    } else {
                        for (let i = 1; i <= endDate.getMonth(); i++) {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                }
            }
            function getMonthArray(year, month, start, end, full) {
                let array = [];
                for (let i = start; i <= end; i++) {
                    let dateItem = full ? year + "/" : "";
                    dateItem += (month + 1) + "/" + i;
                    array.push(dateItem);
                    let yData = Object.keys(preData)
                    yData.forEach(element => {
                        const dateString = (month + 1) + "/" + i + "/" + year;
                        if (preData[element].filter(item => item.date === dateString).length) {
                            const pp = preData[element].filter(item => item.date === dateString)[0].people;
                            if (!preDataSets[element]) preDataSets[element] = [pp]; else preDataSets[element].push(pp);
                        } else {
                            if (!preDataSets[element]) preDataSets[element] = [0]; else preDataSets[element].push(0);
                        }
                    });
                }
                return array;
            }

            let datasets = [];
            Object.keys(preData).forEach(element => {
                datasets.push({
                    label: element,
                    data: preDataSets[element],
                    stack: 'Stack 0',
                });
            });
            const data = {
                labels,
                datasets,
            };
            const chartBarConfig = {
                type: 'bar',
                data: data,
                options: {
                    plugins: {
                        title: {
                            display: false,
                            text: ''
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 10
                            }
                        },
                    },
                    responsive: true,
                    interaction: {
                        intersect: false,
                    },
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true
                        }
                    }
                }
            };
            const ctx = document.getElementById('chart_group_item_' + chartNo);
            if (Chart.getChart('chart_group_item_' + chartNo)) {
                const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                existingChart.destroy();
            }
            new Chart(ctx, chartBarConfig);
        } else {

            if (stateDate.getFullYear() === endDate.getFullYear()) {
                if (stateDate.getMonth() === endDate.getMonth()) {
                    labels = [...labels, ...getMonthArray(stateDate.getFullYear(), stateDate.getMonth(), stateDate.getDate(), endDate.getDate(), false)];
                } else {
                    for (let i = stateDate.getMonth(); i <= endDate.getMonth(); i++) {
                        if (i === stateDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, stateDate.getDate(), new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                        } else if (i === endDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, endDate.getDate(), false)];
                        } else {
                            labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                        }
                    }
                }
            } else {
                for (let j = stateDate.getFullYear(); j <= endDate.getFullYear(); j++) {
                    if (j === stateDate.getFullYear()) {
                        for (let i = stateDate.getMonth(); i <= 11; i++) {
                            if (i === stateDate.getMonth()) {
                                labels = [...labels, ...getMonthArray(j, i, stateDate.getDate(), new Date(j, i + 1, 0).getDate(), true)];
                            } else {
                                labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                            }
                        }
                    } else if (j === endDate.getFullYear()) {
                        for (let i = 1; i <= endDate.getMonth(); i++) {
                            if (i === endDate.getMonth()) {
                                labels = [...labels, ...getMonthArray(j, i, 1, endDate.getDate(), true)];
                            } else {
                                labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                            }
                        }
                    } else {
                        for (let i = 1; i <= endDate.getMonth(); i++) {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                }
            }
            function getMonthArray(year, month, start, end, full) {
                let array = [];
                for (let i = start; i <= end; i++) {
                    let dateItem = full ? year + "/" : "";
                    dateItem += (month + 1) + "/" + i;
                    array.push(dateItem);
                }
                return array;
            }
            const data = {
                labels,
                datasets: [],
            };
            const chartBarConfig = {
                type: 'bar',
                data: data,
                options: {
                    plugins: {
                        title: {
                            display: false,
                            text: ''
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 10
                            }
                        },
                    },
                    responsive: true,
                    interaction: {
                        intersect: false,
                    },
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true
                        }
                    }
                }
            };
            const ctx = document.getElementById('chart_group_item_' + chartNo);
            if (Chart.getChart('chart_group_item_' + chartNo)) {
                const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                existingChart.destroy();
            }
            new Chart(ctx, chartBarConfig);
        }
    });

}

// End New Dashboard Page Init
//  New Dashboard For Admin Page Init

async function processingDataForNewDashboardAdmin(genba, start, end) {
    const stateDate = new Date(start);
    const endDate = new Date(end);
    let preData = {};
    let labels = [];
    let preDataSets = [];
    const result = genba.data;

    if (!result) {

        if (stateDate.getFullYear() === endDate.getFullYear()) {
            if (stateDate.getMonth() === endDate.getMonth()) {
                labels = [...labels, ...getMonthArray(stateDate.getFullYear(), stateDate.getMonth(), stateDate.getDate(), endDate.getDate(), false)];
            } else {
                for (let i = stateDate.getMonth(); i <= endDate.getMonth(); i++) {
                    if (i === stateDate.getMonth()) {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, stateDate.getDate(), new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                    } else if (i === endDate.getMonth()) {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, endDate.getDate(), false)];
                    } else {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                    }
                }
            }
        } else {
            for (let j = stateDate.getFullYear(); j <= endDate.getFullYear(); j++) {
                if (j === stateDate.getFullYear()) {
                    for (let i = stateDate.getMonth(); i <= 11; i++) {
                        if (i === stateDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(j, i, stateDate.getDate(), new Date(j, i + 1, 0).getDate(), true)];
                        } else {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                } else if (j === endDate.getFullYear()) {
                    for (let i = 1; i <= endDate.getMonth(); i++) {
                        if (i === endDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(j, i, 1, endDate.getDate(), true)];
                        } else {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                } else {
                    for (let i = 1; i <= endDate.getMonth(); i++) {
                        labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                    }
                }
            }
        }
        function getMonthArray(year, month, start, end, full) {
            let array = [];
            for (let i = start; i <= end; i++) {
                let dateItem = full ? year + "/" : "";
                dateItem += (month + 1) + "/" + i;
                array.push(dateItem);
            }
            return array;
        }
        let dataset = {
            label: genba.工事名,
            data: [],
            stack: 'Stack 0',
        };
        return {
            labels,
            dataset,
        };
    } else {
        result.forEach(data => {
            for (let n = 1; n <= data.totalLine; n++) {
                if (data) {
                    let col3 = data['人員-' + n] || '-'
                    if (!$.isNumeric(col3)) {
                        col3 = 0
                    }
                    let people = parseFloat(col3);
                    if (col3 !== '-') {
                        if (preData[data.today]) {
                            preData[data.today] += people;
                        } else {
                            preData[data.today] = people;
                        }
                    }
                }
            }
        });
        if (stateDate.getFullYear() === endDate.getFullYear()) {
            if (stateDate.getMonth() === endDate.getMonth()) {
                labels = [...labels, ...getMonthArray(stateDate.getFullYear(), stateDate.getMonth(), stateDate.getDate(), endDate.getDate(), false)];
            } else {
                for (let i = stateDate.getMonth(); i <= endDate.getMonth(); i++) {
                    if (i === stateDate.getMonth()) {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, stateDate.getDate(), new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                    } else if (i === endDate.getMonth()) {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, endDate.getDate(), false)];
                    } else {
                        labels = [...labels, ...getMonthArray(stateDate.getFullYear(), i, 1, new Date(stateDate.getFullYear(), i + 1, 0).getDate(), false)];
                    }
                }
            }
        } else {
            for (let j = stateDate.getFullYear(); j <= endDate.getFullYear(); j++) {
                if (j === stateDate.getFullYear()) {
                    for (let i = stateDate.getMonth(); i <= 11; i++) {
                        if (i === stateDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(j, i, stateDate.getDate(), new Date(j, i + 1, 0).getDate(), true)];
                        } else {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                } else if (j === endDate.getFullYear()) {
                    for (let i = 1; i <= endDate.getMonth(); i++) {
                        if (i === endDate.getMonth()) {
                            labels = [...labels, ...getMonthArray(j, i, 1, endDate.getDate(), true)];
                        } else {
                            labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                        }
                    }
                } else {
                    for (let i = 1; i <= endDate.getMonth(); i++) {
                        labels = [...labels, ...getMonthArray(j, i, 1, new Date(j, i + 1, 0).getDate(), true)];
                    }
                }
            }
        }
        function getMonthArray(year, month, start, end, full) {
            let array = [];
            for (let i = start; i <= end; i++) {
                let dateItem = full ? year + "/" : "";
                dateItem += (month + 1) + "/" + i;
                array.push(dateItem);
                let yData = Object.keys(preData)
                yData.forEach(element => {
                    const dateString = (month + 1) + "/" + i + "/" + year;
                    if (element === dateString) {
                        const pp = preData[element];
                        preDataSets.push(pp);
                    } else {
                        preDataSets.push(0);
                    }
                });
            }
            return array;
        }

        let dataset = {
            label: genba.label,
            data: preDataSets,
            stack: 'Stack 0',
        };

        return {
            labels,
            dataset,
        };
    }
}
function drawCalendarTableForNewAdminDashboard(labels, data, start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let tableContent = "<thead><tr>"
    for (let i = 0; i <= data.length; i++) {
        if (i === 0) {
            tableContent += "<th></th>"
        } else {
            tableContent += "<th>" + data[i - 1].label + "</th>"
        }
    }
    tableContent += "</tr></thead><tbody>";
    for (let i = 0; i < labels.length; i++) {
        tableContent += "<tr><td>";

        if (startDate.getFullYear() === endDate.getFullYear()) {
            const thisDate = new Date(`${startDate.getFullYear()}/${labels[i]}`);
            tableContent += `${thisDate.getMonth()}月 ${thisDate.getDate()}日 (${weekDays[thisDate.getDay()][0]})</td>`;
        } else {
            const thisDate = new Date(labels[i]);
            tableContent += `${thisDate.getFullYear()}年 ${thisDate.getMonth()}月 ${thisDate.getDate()}日 (${weekDays[thisDate.getDay()][0]})</td>`;
        }
        for (let j = 0; j < data.length; j++) {
            tableContent += "<td>";
            if (data[j].data[i]) tableContent += data[j].data[i];
            tableContent += "</td>";
        }
        tableContent += "</tr>";
    }
    tableContent += "</tbody>";
    $(".calendar-table").html(tableContent);
}

function drawChartForNewAdminDashboard(labels, cData) {
    const data = {
        labels: labels,
        datasets: cData,
    };
    const config = {
        type: 'line',
        data: data,
        options: {
            plugins: {
                title: {
                    display: false,
                    text: ''
                },
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10
                    }
                },
            },
            responsive: true,
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true
                }
            }
        }
    };
    const ctx = document.getElementById('chart_group_item_1');
    if (Chart.getChart('chart_group_item_1')) {
        const existingChart = Chart.getChart('chart_group_item_1');
        existingChart.destroy();
    }
    new Chart(ctx, config);
}
//  End New Dashboard For Admin Page Init


