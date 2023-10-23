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
let customHolidays = {}
const nationalHolidays = {
    3 : [20, 21, ],
    4 : [29, ],
    5 : [3, 4, 5, ],
    6 : [],
    7 : [17, ],
    8 : [11, ],
    9 : [18, 23, ],
    10 : [9, ],
    11: [3, 23, ],
    12 : [21, ],
    1 : [1, 8, ],
    2 : [11, 12, 23, ],
}

const todayJP = date.toLocaleDateString('ja-JP', options)

let prevDate = new Date(date);
prevDate.setDate(date.getDate() - 10);
const Before10 = (prevDate.getMonth() + 1) + '/' + prevDate.getDate() + '/' + prevDate.getFullYear();

$(document).ready(async function () {
    feather.replace()
    initGlobalSelector();
    //NEW DASHBOARD PAGE
    if (!!document.querySelector('#new_dashoboard_content')) {
        let userID = $('#userID').attr('data-value')
        let start = $('#start-period').attr('data-value')
        let end = $('#end-period').attr('data-value')
        const fetchCalendar = await $.get("/api/calendar");
        if (fetchCalendar) {
            for ( let item of fetchCalendar) {
                customHolidays["year" + item.year]= item;
                if(!customHolidays["year" + item.year].legalHolidays) {
                    customHolidays["year" + item.year].legalHolidays= {...patternYearHolidays.legalHolidays};
                } else if(!customHolidays["year" + item.year].legalHolidays.days) {
                    customHolidays["year" + item.year].legalHolidays.days = {};
                } else if(!customHolidays["year" + item.year].legalHolidays.week) {
                    customHolidays["year" + item.year].legalHolidays.week = [];
                }
                if(!customHolidays["year" + item.year].scheduledHolidays) {
                    customHolidays["year" + item.year].scheduledHolidays= {...patternYearHolidays.scheduledHolidays};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.days) {
                    customHolidays["year" + item.year].scheduledHolidays.days = {};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.week) {
                    customHolidays["year" + item.year].scheduledHolidays.week = [];
                }
                if (!customHolidays["year" + item.year].workDays) {
                    customHolidays["year" + item.year].workDays = {};
                }
            }
        }
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
        let allGenbaList = [];
        $.get("/api/genba", function (data) {
            $.get('/api/users?elID=' + userID, function (result) {
                if (data) {
                    allGenbaList = data;
                    let realGenba = [];
                    if (localStorage.getItem(userID + "genba0") || localStorage.getItem(userID + "genba1") || localStorage.getItem(userID + "genba2")) {
                        let genbaModalList = '';
                        for (let i = 0; i < 3; i++) {
                            if (localStorage.getItem(userID + "genba" + i)) {
                                if (data.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + i)).length) {
                                    genbaIDs.push(data.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + i))[0])
                                    newDashboardChartInit(genbaIDs, i, data.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + i))[0], Before10, today);
                                    $(".selected-item[data-item='" + i + "'").html('<a class="genba-list-item">' + localStorage.getItem(userID + "genba" + i) + '</a>')
                                    realGenba.push(localStorage.getItem(userID + "genba" + i));
                                }
                            } else {
                                $("#new_dashboard_charts_group" + i).remove();
                            }
                        }

                        result.genba.forEach(function (genba) {
                            if (genba && realGenba.filter(item => item == genba.id).length === 0) {
                                genbaModalList += '<a class="genba-list-item">' + genba.name + '</a>';
                            }
                        });
                        $(".sort-genba-list").html(genbaModalList);
                    } else {
                        let genbaModalList = '';
                        let iiii = 0;
                        result.genba.forEach(function (genba) {
                            if (genba) {
                                realGenba.push(genba.name);
                                if (iiii > 2) {
                                    genbaModalList += '<a class="genba-list-item">' + genba.name + '</a>';
                                }
                                iiii++;
                            }
                        });
                        $(".sort-genba-list").html(genbaModalList);
                        for (let i = 0; i < 3; i++) {
                            if (realGenba[i] && data.filter(item => item.工事名 === realGenba[i]).length) {
                                genbaIDs.push(data.filter(item => item.工事名 === realGenba[i])[0])
                                $(".selected-item[data-item='" + i + "'").html('<a class="genba-list-item">' + realGenba[i] + '</a>')
                                newDashboardChartInit(genbaIDs, i, data.filter(item => item.工事名 === realGenba[i])[0], Before10, today);
                                localStorage.setItem(userID + "genba" + i, data.filter(item => item.工事名 === realGenba[i])[0].工事名);
                            }
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
            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], ct, $('.chart-date.end').attr('data-date'));

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
            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], $('.chart-date.start').attr('data-date'), ct);
        })

        $(".sortable-genba-list").sortable({
            connectWith: '.sortable-genba-list',
            receive: function (event, ui) {
                var $list1 = $(".sort-genba-list");
                var $list2 = $(this);
                var droppedItem = ui.item.text();
                if ($list2.children().length > 1 && $list2.hasClass("selected-item")) {
                    // Remove the existing item from the second list
                    var $existingItem = $list2.children().filter(function () {
                        return $(this).text() !== droppedItem;
                    })[0];
                    $existingItem.remove();
                    // Append the dropped item to the second list
                    $list2.append(ui.item);

                    // Return the existing item to the first list
                    $list1.append($existingItem);
                } else {
                    // Append the dropped item to the second list
                    $list2.append(ui.item);
                }
            }
        });
        $(document).on('click', '#genba-select-modal-toggle', function () {
            for (let i = 0; i < 3; i++) {
                if (localStorage.getItem(userID + "genba" + i)) {
                    $(".selected-item[data-item='" + i + "'").html('<a class="genba-list-item">' + localStorage.getItem(userID + "genba" + i) + '</a>');
                } else {
                    $(".selected-item[data-item='" + i + "'").html('');
                }
            }
            setTimeout(() => {
                $('#genbaSelectModal').modal('show');
            }, 400)
        });
        $(document).on('click', '.chart-close-btn', function () {
            if (localStorage.getItem(userID + "genba" + $(this).attr("chart-no"))) {
                localStorage.removeItem(userID + "genba" + $(this).attr("chart-no"));
            }
            $("#new_dashboard_charts_group" + $(this).attr("chart-no")).remove();
        });
        $(document).on('click', '#confirmModalBtn', function () {
            $(".selected-genba-list").find(".selected-item").each(function (index) {
                if ($(this).children().length > 0) {
                    localStorage.setItem(userID + "genba" + index, $(this).children().first().text());
                } else {
                    localStorage.removeItem(userID + "genba" + index)
                }
            });
            if (allGenbaList) {
                genbaIDs = [];
                for (let ii = 0; ii < 3; ii++) {
                    if (localStorage.getItem(userID + "genba" + ii)) {
                        if (allGenbaList.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + ii)).length) {
                            genbaIDs[ii] = allGenbaList.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + ii))[0];
                            newDashboardChartInit(genbaIDs, ii, allGenbaList.filter(item => item.工事名 === localStorage.getItem(userID + "genba" + ii))[0], Before10, today);
                        }
                    } else {
                        $("#new_dashboard_charts_group" + ii).remove();
                    }
                }
            }
            $('#genbaSelectModal').modal('hide');
        });
    }

    //NEW DASHBOARD ADMIN PAGE
    if (!!document.querySelector('#new_dashoboard_content_admin')) {
        let userID = $('#userID').attr('data-value');
        let start = $('#start-period').attr('data-value');
        let end = $('#end-period').attr('data-value');
        let labels = null;
        let dataSets = [];
        const fetchCalendar = await $.get("/api/calendar");
        if (fetchCalendar) {
            for ( let item of fetchCalendar) {
                customHolidays["year" + item.year]= item;
                if(!customHolidays["year" + item.year].legalHolidays) {
                    customHolidays["year" + item.year].legalHolidays= {...patternYearHolidays.legalHolidays};
                } else if(!customHolidays["year" + item.year].legalHolidays.days) {
                    customHolidays["year" + item.year].legalHolidays.days = {};
                } else if(!customHolidays["year" + item.year].legalHolidays.week) {
                    customHolidays["year" + item.year].legalHolidays.week = [];
                }
                if(!customHolidays["year" + item.year].scheduledHolidays) {
                    customHolidays["year" + item.year].scheduledHolidays= {...patternYearHolidays.scheduledHolidays};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.days) {
                    customHolidays["year" + item.year].scheduledHolidays.days = {};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.week) {
                    customHolidays["year" + item.year].scheduledHolidays.week = [];
                }
                if (!customHolidays["year" + item.year].workDays) {
                    customHolidays["year" + item.year].workDays = {};
                }
            }
        }
        const genbaList = await $.get('/api/genbaStatistic?today=' + today + '&start=' + start + '&end=' + today + '&userID=' + userID);
        let allPeopleNum=0;
        for (let i = 0; i < genbaList.length; i++) {
            const res = await processingDataForNewDashboardAdmin(genbaList[i], Before10, today, i);
            dataSets.push(res.dataset);
            if (!labels) labels = res.labels;
            allPeopleNum += res.allPeopleNum;
        }
        await drawChartForNewAdminDashboard(labels, dataSets, allPeopleNum)

        function configureDatepicker(selector, changeCallback) {
            $(selector).datepicker({
                language: "ja",
                format: 'yyyy/m/d',
                autoclose: true,
                todayHighlight: true,
                endDate: new Date(),
            }).on('changeDate', changeCallback);
        }
        
        async function processDataAndDrawChart(chartNo, startSelector, endSelector) {
            const startDate = $(startSelector).attr('data-date');
            const endDate = $(endSelector).attr('data-date');
            const genbaList = await $.get(`/api/genbaStatistic?today=${today}&start=${startDate}&end=${endDate}&userID=${userID}`);
            console.log(genbaList)
            const changeDataSet = [];
            let allPeopleNum = 0;
            
            for (let i = 0; i < genbaList.length; i++) {
                const res = await processingDataForNewDashboardAdmin(genbaList[i], startDate, endDate, i);
                console.log({res})
                changeDataSet.push(res.dataset);
                labels = res.labels;
                allPeopleNum += res.allPeopleNum;
            }
            
            await drawChartForNewAdminDashboard(labels, changeDataSet, allPeopleNum);
        }
        
        configureDatepicker('.chart-date.start', async function (e) {
            const chartNo = Number($(this).attr("chart-no"));
            const date = new Date(e.date);
            
            if ($(`.chart-date.end[chart-no="${chartNo}"]`).datepicker('getStartDate') < date) {
                $(`.chart-date.end[chart-no="${chartNo}"]`).datepicker('setStartDate', date);
            }
            
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            $(`.chart-date.start[chart-no="${chartNo}"]`).attr('data-date', formattedDate);
            
            await processDataAndDrawChart(chartNo, `.chart-date.start[chart-no="${chartNo}"]`, '.chart-date.end');
        });
        
        configureDatepicker('.chart-date.end', async function (e) {
            const chartNo = Number($(this).attr("chart-no"));
            const date = new Date(e.date);
            
            if ($(`.chart-date.start[chart-no="${chartNo}"]`).datepicker('getEndDate') > date) {
                $(`.chart-date.start[chart-no="${chartNo}"]`).datepicker('setEndDate', date);
            }
            
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            $(`.chart-date.end[chart-no="${chartNo}"]`).attr('data-date', formattedDate);
            
            await processDataAndDrawChart(chartNo, '.chart-date.start', `.chart-date.end[chart-no="${chartNo}"]`);
        });
        
        const startVal = prevDate.getFullYear() + '/' + (prevDate.getMonth() + 1) + '/' + prevDate.getDate();
        const endVal = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
        let prevDateCt = (prevDate.getMonth() + 1) + '/' + prevDate.getDate() + '/' + prevDate.getFullYear();
        $('.chart-date.start').val(startVal).change();
        $('.chart-date.end').val(endVal).change();
        $('.chart-date.start').attr('data-date', prevDateCt);
        $('.chart-date.end').attr('data-date', today);
        $('.chart-date.start').datepicker('update');
        $('.chart-date.end').datepicker('update');
        
        $(document).on('change', '.period-list.globalselector', async function () {
            let lastStart = $(".period-list.globalselector option:last").attr('data-value').toString().split(' - ')[0];
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
            $(".calendar-table").html(`<tbody> <tr><td><div class="d-flex justify-content-center" style="align-items:center;height:300px;"><div class="spinner-border" role="status"><div class="sr-only">ローディング...</div></div></div></td></tr></tbody>`);

            if (new Date(postEnd) >= new Date(today)) {
                const usersData = await $.get('/api/userStatistic?today=' + today + '&start=' + postStart + '&end=' + today);
                await drawCalendarTableForNewAdminDashboard(usersData, postStart, today)
            } else {
                const usersData = await $.get('/api/userStatistic?today=' + today + '&start=' + postStart + '&end=' + postEnd);
                await drawCalendarTableForNewAdminDashboard(usersData, postStart, postEnd)
            }


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
    }

    //NEW HOLIDAY SETTING PAGE
    if (!!document.querySelector('#new_dashoboard_setting_holidays')) {
        let changedData = false;
        const fetchCalendar = await $.get("/api/calendar");
        if (fetchCalendar) {
            for ( let item of fetchCalendar) {
                customHolidays["year" + item.year]= item;
                if(!customHolidays["year" + item.year].legalHolidays) {
                    customHolidays["year" + item.year].legalHolidays= {...patternYearHolidays.legalHolidays};
                } else if(!customHolidays["year" + item.year].legalHolidays.days) {
                    customHolidays["year" + item.year].legalHolidays.days = {};
                } else if(!customHolidays["year" + item.year].legalHolidays.week) {
                    customHolidays["year" + item.year].legalHolidays.week = [];
                }
                if(!customHolidays["year" + item.year].scheduledHolidays) {
                    customHolidays["year" + item.year].scheduledHolidays= {...patternYearHolidays.scheduledHolidays};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.days) {
                    customHolidays["year" + item.year].scheduledHolidays.days = {};
                } else if(!customHolidays["year" + item.year].scheduledHolidays.week) {
                    customHolidays["year" + item.year].scheduledHolidays.week = [];
                }
                if (!customHolidays["year" + item.year].workDays) {
                    customHolidays["year" + item.year].workDays = {};
                }
            }
        }
        if (customHolidays["year" + new Date().getFullYear().toString()]) {
            const currentYearData = customHolidays["year" + new Date().getFullYear().toString()];
            if (currentYearData.legalHolidays.week.length) {
                $("#legalHolidayCheck input").each(function () {
                    if(currentYearData.legalHolidays.week.indexOf($(this).attr("name")) > -1) {
                        $("#legalHolidayCheck input[name='" + $(this).attr("name") + "']").prop('checked', true);
                    }
                });
            }
            if (currentYearData.scheduledHolidays.week.length) {
                $("#scheduledHolidayCheck input").each(function () {
                    if(currentYearData.scheduledHolidays.week.indexOf($(this).attr("name")) > -1) {
                        $("#scheduledHolidayCheck input[name='" + $(this).attr("name") + "']").prop('checked', true);
                    }
                });

            }
            if (currentYearData.yearEndAndNewYear == "1") {
                $("#yearEndAndNewYear").prop('checked', true);
            }
        }
        let yearCalendar2018 = $("<div>");
        yearCalendar2018.attr("id", "bodyCalendar");
        yearCalendar2018.addClass("yearCalendar");

        const months2018 = [
            {
                name: "march",
                index: 3,
                node: createDiv(),
                calendar: createMonthCalendar
            },
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
        const months2019 = [
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
        ];
        const monthIds = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december',
        ]
        for (let month = 0; month < 10; month++) {
            yearCalendar2018.append(months2018[month].calendar());
        }

        calendarDate.setFullYear(calendarDate.getFullYear() + 1);
        for (let month = 0; month < 2; month++) {
            yearCalendar2018.append(months2019[month].calendar());
        }
        $("#calendar_for_holiday").html(yearCalendar2018);
        // Event Listners
        $(document).on('click', '#saveBtn', async function () {
            $('#preloader').fadeIn('fast', function () {
                $('#mainContainer').fadeOut(500)
                // $('body').find('select').niceSelect();
            });
            const currentYear = $("#currentYear").val();
            if (customHolidays["year" + currentYear]) {
                let sendData = customHolidays["year" + currentYear];
                if (!sendData.year) sendData.year = currentYear;
                $.post('/api/saveYearCalendar', sendData, function () {
                    console.log("OK");
                    $('#preloader').fadeOut('fast', function () {
                        $('#mainContainer').fadeIn(500);
                        changedData = false;
                    });
                });
            }
        });
        $(document).on('click', '.edit-holiday-btn', async function () {
            let modalMonth = {
                name: "modalMonth",
                index: parseInt($(this).attr("data-month")),
                node: createDiv(),
                calendar: createMonthCalendar
            };
            const currentYear = $("#currentYear").val();
            calendarDate.setFullYear(parseInt($(this).attr("data-year")));
            let monthContent = modalMonth.calendar();
            $(monthContent).find(".edit-holiday-btn").remove();
            let modalMonthHolidays = "";
            await $(monthContent).find("table tbody td").each(function () {
                const month = $(this).attr("data-month");
                const year = $(this).attr("data-year");
                if ($(this).text()) {
                    if($(this).hasClass("saturday")) {
                        modalMonthHolidays +='<div><span class="px-1">'+ year + '/' + month + '/' + $(this).text() + '</span><select class="custom-select-1 col-6 custom-select-2" name="month_start" ><option value="1" >所定休日</option><option value="2" selected>法定休日</option><option value="3" >出勤日</option></select><button class="px-1 close chart-close-btn col-1"><span aria-hidden="true">×</span></button></div>';
                    } else if($(this).hasClass("sunday")) {
                        modalMonthHolidays +='<div><span class="px-1">'+ year + '/' + month + '/' + $(this).text() + '</span><select class="custom-select-1 col-6 custom-select-2" name="month_start" ><option value="1" selected>所定休日</option><option value="2" >法定休日</option><option value="3" >出勤日</option></select><button class="px-1 close chart-close-btn col-1"><span aria-hidden="true">×</span></button></div>';
                    } else if($(this).hasClass("workday")) {
                        modalMonthHolidays +='<div><span class="px-1">'+ year + '/' + month + '/' + $(this).text() + '</span><select class="custom-select-1 col-6 custom-select-2" name="month_start" ><option value="1" >所定休日</option><option value="2" >法定休日</option><option value="3" selected>出勤日</option></select><button class="px-1 close chart-close-btn col-1"><span aria-hidden="true">×</span></button></div>';
                    }
                }
            });
            $("#modalMonthHolidays").html(modalMonthHolidays);
            $("#modalMonthContent").html(monthContent);
            $('#editMonth').modal('show');
        });
        $(document).on('click', '#modalMonthContent table td', function () {
            changedData = true;
            if($(this).text() !== "") {
                const year = $(this).attr("data-year");
                const month = $(this).attr("data-month");
                if ($("#modalMonthHolidays > div > span.px-1:contains('"+ year + "/" + month + "/" + $(this).text() +"')").length === 0) {
                    let dayType = "3"; let dayClass="workday";
                    if ($(this).hasClass("sunday") || $(this).hasClass("scheduledWeek")) {
                        dayType = "1"; dayClass = "sunday";
                    } else if($(this).hasClass("saturday") || $(this).hasClass("legalWeek")) {
                        dayType = "2"; dayClass = "saturday";
                    }
                    let content = '<div ><span class="px-1">'+ year + '/' + month + '/' + $(this).text() + '</span><select class="custom-select-1 col-6 custom-select-2" name="month_start" ><option value="1" '+ (dayType == '1' ? 'selected' :'') + '>所定休日</option><option value="2" '+( dayType == '2' ? 'selected' :'') + '>法定休日</option><option value="3" '+ (dayType == '3' ? 'selected' :'') + '>出勤日</option></select><button class="px-1 close chart-close-btn col-1"><span aria-hidden="true">×</span></button></div>';
                    $("#modalMonthContent table td[data-year='"+year+"'][data-month='"+ month+"'][data-date='"+ $(this).text() + "']").addClass(dayClass);
                    $("#modalMonthHolidays").append(content);
                } else return;
            } else return;
        });
        $(document).on('click', '#modalMonthHolidays .chart-close-btn', function () {
            changedData = true;
            const fullDate = $(this).parent().find("span.px-1").text().split('/');
            if ($("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").hasClass("sunday"))$("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").removeClass("sunday");
            if ($("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").hasClass("saturday"))$("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").removeClass("saturday");
            if ($("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").hasClass("workday"))$("#modalMonthContent table td[data-year='"+fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2] + "']").removeClass("workday");
            $(this).parent().remove();
        });
        $(document).on('click', '#confirmEditMonthModalBtn', function () {
            const currentMonth = $("#modalMonthContent table .year-and-month").attr("month");
            const currentYear = $("#currentYear").val();
            $("#modalMonthContent table tbody td").each(function () {
                if ($(this).text()) {
                    const month = $(this).attr("data-month");
                    const year = $(this).attr("data-year");
                    if($(this).hasClass("saturday")) {
                        if(customHolidays["year" + currentYear].legalHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()) < 0) {
                                customHolidays["year" + currentYear].legalHolidays.days["month" + month].push($(this).text());
                            }
                        } else {
                            customHolidays["year" + currentYear].legalHolidays.days["month" + month] = [$(this).text()]
                        }
                        if(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].splice(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].workDays["month" + month]) {
                            if (customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].workDays["month" + month].splice(customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                    } else if($(this).hasClass("sunday")) {
                        if(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()) < 0) {
                                customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].push($(this).text());
                            }
                        } else {
                            customHolidays["year" + currentYear].scheduledHolidays.days["month" + month] = [$(this).text()]
                        }
                        if(customHolidays["year" + currentYear].legalHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].legalHolidays.days["month" + month].splice(customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].workDays["month" + month]) {
                            if (customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].workDays["month" + month].splice(customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                    } else if($(this).hasClass("workday")) {
                        if(customHolidays["year" + currentYear].legalHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].legalHolidays.days["month" + month].splice(customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].splice(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].workDays["month" + month]) {
                            if (customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()) < 0) {
                                customHolidays["year" + currentYear].workDays["month" + month].push($(this).text());
                            }
                        } else {
                            customHolidays["year" + currentYear].workDays["month" + month] = [$(this).text()]
                        }
                    } else {
                        if(customHolidays["year" + currentYear].legalHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].legalHolidays.days["month" + month].splice(customHolidays["year" + currentYear].legalHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month]) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].splice(customHolidays["year" + currentYear].scheduledHolidays.days["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                        if(customHolidays["year" + currentYear].workDays["month" + month]) {
                            if (customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()) > -1) {
                                customHolidays["year" + currentYear].workDays["month" + month].splice(customHolidays["year" + currentYear].workDays["month" + month].indexOf($(this).text()), 1);
                            }
                        }
                    }
                }
            });
            $("#bodyCalendar #"+ monthIds[parseInt(currentMonth) - 1] + " table tbody").html($("#modalMonthContent table tbody").html());
            $('#editMonth').modal('hide');
        });

        $(document).on("change", "#modalMonthHolidays .custom-select-1", function () {
            changedData = true;
            const fullDate = $(this).parent().find("span.px-1").text().split('/');
            if ($(this).val() == "1") {
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("workday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("workday");
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("saturday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("saturday");
                $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").addClass("sunday");
            } else if ($(this).val() == "2") {
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("sunday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("sunday");
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("workday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("workday");
                $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").addClass("saturday");
            } else {
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("sunday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("sunday");
                if($("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").hasClass("saturday")) $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").removeClass("saturday");
                $("#modalMonthContent table td[data-year='"+ fullDate[0]+"'][data-month='"+ fullDate[1]+"'][data-date='"+ fullDate[2]+"']").addClass("workday");
            }
        });
        $(document).on("change", "#scheduledHolidayCheck input", function () {
            changedData = true;
            $("#calendar_for_holiday").html("");
            const currentYear = $("#currentYear").val();
            if ($(this).is(':checked')) {
                if (customHolidays["year" + currentYear]) {
                    customHolidays["year" + currentYear].scheduledHolidays.week.push($(this).attr("name"));
                    if(customHolidays["year" + currentYear].legalHolidays.week.indexOf($(this).attr("name")) > -1) {
                        customHolidays["year" + currentYear].legalHolidays.week.splice(customHolidays["year" + currentYear].legalHolidays.week.indexOf($(this).attr("name")), 1);
                    }
                }
            } else {
                if(customHolidays["year" + currentYear].scheduledHolidays.week.indexOf($(this).attr("name")) > -1) {
                    customHolidays["year" + currentYear].scheduledHolidays.week.splice(customHolidays["year" + currentYear].scheduledHolidays.week.indexOf($(this).attr("name")), 1);
                }
            }
            if($("#legalHolidayCheck input[name='" + $(this).attr("name") + "']").is(':checked')) {
                $("#legalHolidayCheck input[name='" + $(this).attr("name") + "']").prop('checked', false);
            }

            let updateYearCalendar = $("<div>");
            calendarDate.setFullYear(currentYear);
            updateYearCalendar.attr("id", "bodyCalendar");
            updateYearCalendar.addClass("yearCalendar");
            for (let month = 0; month < 10; month++) {
                updateYearCalendar.append(months2018[month].calendar());
            }
    
            calendarDate.setFullYear(parseInt(currentYear) + 1);
            for (let month = 0; month < 2; month++) {
                updateYearCalendar.append(months2019[month].calendar());
            }
            $("#calendar_for_holiday").html(updateYearCalendar);
        });
        $(document).on("change", "#legalHolidayCheck input", function () {
            changedData = true;
            $("#calendar_for_holiday").html("");
            const currentYear = $("#currentYear").val();
            if ($(this).is(':checked')) {
                if (customHolidays["year" + currentYear]) {
                    customHolidays["year" + currentYear].legalHolidays.week.push($(this).attr("name"));
                    if(customHolidays["year" + currentYear].scheduledHolidays.week.indexOf($(this).attr("name")) > -1) {
                        customHolidays["year" + currentYear].scheduledHolidays.week.splice(customHolidays["year" + currentYear].scheduledHolidays.week.indexOf($(this).attr("name")), 1);
                    }
                }
            } else {
                if(customHolidays["year" + currentYear].legalHolidays.week.indexOf($(this).attr("name")) > -1) {
                    customHolidays["year" + currentYear].legalHolidays.week.splice(customHolidays["year" + currentYear].legalHolidays.week.indexOf($(this).attr("name")), 1);
                }
            }
            if($("#scheduledHolidayCheck input[name='" + $(this).attr("name") + "']").is(':checked')) {
                $("#scheduledHolidayCheck input[name='" + $(this).attr("name") + "']").prop('checked', false);
            }

            let updateYearCalendar = $("<div>");
            calendarDate.setFullYear(currentYear);
            updateYearCalendar.attr("id", "bodyCalendar");
            updateYearCalendar.addClass("yearCalendar");
            for (let month = 0; month < 10; month++) {
                updateYearCalendar.append(months2018[month].calendar());
            }
    
            calendarDate.setFullYear(parseInt(currentYear) + 1);
            for (let month = 0; month < 2; month++) {
                updateYearCalendar.append(months2019[month].calendar());
            }
            $("#calendar_for_holiday").html(updateYearCalendar);
        });
        $(document).on("change", "#yearEndAndNewYear", function () {
            changedData = true;
            const currentYear = $("#currentYear").val();
            if (customHolidays["year" + currentYear]) {
                if ($(this).is(':checked')) {
                    customHolidays["year" + currentYear].yearEndAndNewYear = "1";
                } else {
                    customHolidays["year" + currentYear].yearEndAndNewYear = "0";
                }
                let updateYearCalendar = $("<div>");
                calendarDate.setFullYear(currentYear);
                updateYearCalendar.attr("id", "bodyCalendar");
                updateYearCalendar.addClass("yearCalendar");
                for (let month = 0; month < 10; month++) {
                    updateYearCalendar.append(months2018[month].calendar());
                }
                calendarDate.setFullYear(parseInt(currentYear) + 1);
                for (let month = 0; month < 2; month++) {
                    updateYearCalendar.append(months2019[month].calendar());
                }
                $("#calendar_for_holiday").html(updateYearCalendar);
            }
        });
        $(document).on("change", "#currentYear", function () {
            const currentYear = $(this).val();
            let updateYearCalendar = $("<div>");
            calendarDate.setFullYear(currentYear);
            updateYearCalendar.attr("id", "bodyCalendar");
            updateYearCalendar.addClass("yearCalendar");
            for (let month = 0; month < 10; month++) {
                updateYearCalendar.append(months2018[month].calendar());
            }
            calendarDate.setFullYear(parseInt(currentYear) + 1);
            for (let month = 0; month < 2; month++) {
                updateYearCalendar.append(months2019[month].calendar());
            }
            if (customHolidays["year" + currentYear]) {
                if (customHolidays["year" + currentYear].legalHolidays && customHolidays["year" + currentYear].legalHolidays.week) {
                    $("#legalHolidayCheck input").each(function () {
                        if (customHolidays["year" + currentYear].legalHolidays.week.indexOf($(this).attr("name")) > -1) {
                            $(this).prop('checked', true);
                        } else {
                            $(this).prop('checked', false);
                        }
                    });
                } else {
                    $("#legalHolidayCheck input").each(function () {
                        $(this).prop('checked', false);
                    });
                }
                if (customHolidays["year" + currentYear].scheduledHolidays && customHolidays["year" + currentYear].scheduledHolidays.week) {
                    $("#scheduledHolidayCheck input").each(function () {
                        if (customHolidays["year" + currentYear].scheduledHolidays.week.indexOf($(this).attr("name")) > -1) {
                            $(this).prop('checked', true);
                        } else {
                            $(this).prop('checked', false);
                        }
                    });
                } else {
                    $("#scheduledHolidayCheck input").each(function () {
                        $(this).prop('checked', false);
                    });
                }
                if (customHolidays["year" + currentYear].yearEndAndNewYear === "1") {
                    $("#yearEndAndNewYear").prop('checked', true);
                } else {
                    $("#yearEndAndNewYear").prop('checked', false);
                }
            } else {
                $("#yearEndAndNewYear").prop('checked', false);
                $("#scheduledHolidayCheck input").each(function () {
                    $(this).prop('checked', false);
                });
                $("#legalHolidayCheck input").each(function () {
                    $(this).prop('checked', false);
                });
            }

            $("#calendar_for_holiday").html(updateYearCalendar);
        });
        window.addEventListener('beforeunload', function (event) {
            if (changedData) {
                event.preventDefault();
                event.returnValue = 'このページを離れますか？';
            }
        });
    }

    //LOGIN PAGE
    if (!!document.querySelector('#loginForm')) {
        loginInit()
    }
    //FORGOT PASSWORD PAGE
    if (!!document.querySelector('#forgotPassword')) {
        //HIDE NAVBAR
        $('nav').hide()
        $('body').addClass('bg-white')
        $('main').addClass('bg-white')
        $(document).on("submit", "#forgotPasswordForm", function (e) {
            if(!$("#inputEmail").val() || !$("#inputEmail").val().toString().trim() || $("#inputEmail").val().indexOf("@") == -1 || $("#inputEmail").val().indexOf('.') == -1) {
                e.preventDefault();
                $("#invalidEmail").show();
            }
        });
        $(document).on("keydown", "#inputEmail", function () {
            $("#invalidEmail").hide();
            if ($("#error")) $("#error").hide();
        });
    }
    
    //NIPPO FORM PAGE
    if (!!document.querySelector("#formPage")) {
        nippoFormInit()
        genbatoday($('#userID').attr('data-value'), today)
        $('.SelectUserID').attr('data-selectid', $('#userID').attr('data-value'))
        SUA({ event: '日報入力ページ' });
    }
    //ICHIRAN PAGE
    if (!!document.querySelector('.period-list') || !!document.querySelector('.ichiranPage')) {        
        handleNippoIchiran()
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

    // new[monkey]
    //DAITYOU Page
    // TODO
    if (!!document.querySelector('#daityouPage')) {
        SUA({ event: '工事台帳ページ' });
    }

    if (!!document.querySelector('#daityouGenba')) {
        daityouGenbaInit()
        SUA({ event: '現場まとめページ' });
    }

    if (!!document.querySelector('#daityouSiharaIchiran')) {
        daityouSiharaIchiran()
        SUA({ event: '支払一覧ページ' });
    }

    if (!!document.querySelector('#daityouGenbaIchiran')) {
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
        SUA({ event: '現場日報ページ' })
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
    ) {
        //afterAllisDone()
    }



    //TOOLS
    updateUserInfo();
    adminOnly();
    navigationActive();
    updateDate();
    miniTools();

    inputInit();

});
$(document).ajaxStop(function () {
    formInitCompany();
    reloadNiceselect();
    displayMainContent()
    feather.replace();
});
function reloadNiceselect(){
    // First, destroy the current niceSelect instance
    $('body').find('select').niceSelect('destroy');

    // Then, re-initialize niceSelect
    $('body').find('select').niceSelect();
}
function displayMainContent(){
    $('#mainContainer').show()
    $('#preloader').hide();
    $('body').find('select').niceSelect();
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

        // Use explicit format with moment.js
        var pDay = moment(ctoday, "MM/DD/YYYY").subtract(1, 'days').toDate();
        var nDay = moment(ctoday, "MM/DD/YYYY").add(1, 'days').toDate();

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
        if(false){
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

$(document).on('click','#nav-nippo-tab',function() {
    //handleNippoIchiran()
})

function handleNippoIchiran(){
    if (!! document.querySelector('#nippoichiran.current')) {
        let selectid=getUrlParameter('selectid') || $('#userID').attr('data-value')
        nippoIchiranInit(selectid,today)
    }
    SUA({event:$('.title').text()})
}
//NIPPO FORM
function nippoFormInit(callback) {
    //INITIALIZE FORM FIELDS
    let userID = $('#userID').attr('data-value')
    if (getUrlParameter('u') != undefined && getUrlParameter('u')) {
        const year = getUrlParameter('y')
        const month = getUrlParameter('m')
        const date = getUrlParameter('d')
        initFormField(getUrlParameter('u'), `${month}/${date}/${year}`, 'nippo')
    } else if (getUrlParameter('y') != undefined && getUrlParameter('y')) {
        const year = getUrlParameter('y')
        const month = getUrlParameter('m')
        const date = getUrlParameter('d')
        initFormField(userID, `${month}/${date}/${year}`, 'nippo')
    } else {
        initFormField(userID, today, 'nippo')
    }
    //ENABLE SETTINGS
    nippoFormSetting()
    //DISPLAY ALERT IF MORE THAN 10HOURS
    $(document).on('change', 'select.input-time', function () {
        updateTotalTime()
    })

    autoSaveNippoForm()
    if (callback) {callback()}
}

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
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                }
            })
            $.each($(this).find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                } else {
                    if($(this).attr('data-name')) {
                        let name = $(this).attr('data-name').substring(0, $(this).attr('data-name').indexOf('-') + 1)
                        $(this).attr('data-name', name + index)
                    }
                }
            })
            $.each($(this).find('textarea'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + index)
                }
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
    let $selectedOption = $('.period-list.globalselector').find('option:checked');
    let dataValue = $selectedOption.attr('data-value');

    let start = "";
    let end = "";

    if (dataValue) {
        let indexOfDash = dataValue.indexOf('-');
        if (indexOfDash !== -1) {
            start = dataValue.substring(0, indexOfDash).trim(); // Extracting start
            end = dataValue.substring(indexOfDash + 1).trim(); // Extracting end
        }
    }

    if (!!document.querySelector('#nippoichiran') && start && end) {
        nippoIchiranInit(userID, today, start, end);
    }
    if (!!document.querySelector('#genbaichiran')  && start && end) {
        $('.input-genba.globalselector').attr('data-userid', userID)
        genbaIchiranInit(today, start, end)
    }
}
//DISPLAY NIPPO UNTIL YESTERDAY
async function nippoIchiranInit(userID, today, start, end) {
    start = start || false; end = end || false
    if ((!start) && (!end)) {
        start = $('#start-period').attr('data-value')
        end = $('#end-period').attr('data-value')
    }
    if (!$('#nippoichiran').hasClass('ongoing')) {
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
            $('.info.nippo-loading').removeClass('d-none')
        }
        if ($('.info.nippo-loading').hasClass('d-none')) {
            $('.info.nippo-loading').removeClass('d-none')
        }
        $.get('/api/nippoichiran?userID='+userID+'&today='+today+'&start='+start+'&end='+end, async function(result){
            $('#nippoichiran .ichiran thead tr').html('')
            $('#nippoichiran').show()
            //SET HEADINGS
            $('#nippoichiran .ichiran thead tr').prepend('<th scope="col" class="pl-2 py-2" style="cursor:pointer" onclick="sortTableByDate(\'tableIchiran\', 0, \'nippo-arrow-up\', \'nippo-arrow-down\')">日付<i id="nippo-arrow-up" style="width: 20px; height: 20px; margin-left: 5px; display:none;" data-feather="arrow-up"></i><i id="nippo-arrow-down" style="width: 20px; height: 20px; margin-left: 5px" data-feather="arrow-down"></i></th><th scope="col" class="pl-2 py-2">現場名</th><th scope="col" class="pl-2 py-2">作業名</th><th scope="col" class="pl-2 py-2">日数</th><th scope="col" class="pl-2 py-2">作業内容</th><th scope="col" class="pl-2 py-2 d-none"></th>')            
            if (result) {
                let genbaList = await $.get("/api/genba");
                let info = { event: 'nippo-shukei', totalDays: 0 }
                result.forEach(data => {
                    let res_content = ''
                    if (data._id) {
                        for (let n = 1; n <= data.totalLine; n++) {
                            let genba = genbaList.filter(genba => genba._id === data['工事名-'+n]);
                            let genbaName = data['工事名-'+n];
                            if (genba[0]) {
                                genbaName = genba[0].工事名
                            }
                            let col1 = genbaName || '-'
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
                                list_content_item += '<div class="list_container ms-nippoichiran row px-3 py-2 border rounded-0 m-0 bg-white w-100" data-id="' + data._id + '" data-value="' + n + '">'
                                list_content_item += '<div class="list_container ms-genbanippo row px-3 py-2 border rounded-0 m-0 bg-white w-100" data-id="'+data._id+'" data-value="'+n+'">'
                                content += '<td><span class="pl-2 py-3 isweekend-'+data['todayJP'].substring(data['todayJP'].indexOf('(')).replace('(','').replace(')','')+'" style="width:auto;display:inline-block" data-name="todayJP" data-value="'+westernDate(data['date'])+'">'+westernDate(data['date'])+'</span></td>'

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
            }
            if (!$('.info.nippo-loading').hasClass('d-none')) {
                $('.info.nippo-loading').addClass('d-none')
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
    }else{
        //console.log(`Nippo ichiran is loading`)
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
        if(false){console.log({
            event: 'initFormField',
            editForm: editForm,
            userID: userID,
            genbaID: genbaID,
            day: day,
        })}
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
        $.each(formID.find('select'), function () {
            $(this).val('').change()
            $(this).niceSelect('update')
        })
        $.each(formID.find('textarea'), function () {
            $(this).val('').change()
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
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
            $.each(groupContainer.find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
            $.each(groupContainer.find('textarea'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
        } else {
            let group = $(formID + ' .form-container .form-group').first().clone()
            $(formID + ' .form-container .form-group').remove()
            $(formID + ' .form-container').append(group).fadeIn(500);
            $('.totalLine.' + formSelect).attr('value', 1)
            group.find('.removeGroup').attr('data-value', 1)
            $.each(group.find('input'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()                    
                }
            })
            $.each(group.find('select'), function () {
                if ($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
            $.each(group.find('textarea'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + '1')
                    $(this).val('').change()
                }
            })
        }
    }
}
function addGroupForm(formSelect, formIndex) {
    let formID = 'form.' + formSelect + '[data-value="' + formIndex + '"]'
    let group = $(formID + ' .form-container .form-group').last().clone()
    let currVal = parseInt(group.attr('data-value')) + 1

    group.find('.input-temp').remove()
    group.attr('data-value', currVal)
    let gIc = parseInt($(formID + ' .form-container .form-group').length + 1)
    $('.totalLine.' + formSelect).attr('value', gIc)
    group.find('.removeGroup').attr('data-value', currVal)
    group.find('label').remove()
    $(formID + ' .form-container').append(group).fadeIn(500);
    $.each(group.find('input'), function () {
        if($(this).attr('name')) {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
            $(this).attr('value', '');
        }
    })
    $.each(group.find('select'), function () {
        if($(this).attr('name')) {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
            $(this).niceSelect('update')
        }
    })
    $.each(group.find('textarea'), function () {
        if($(this).attr('name')) {
            let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
            $(this).attr('name', name + currVal)
            $(this).val('').change()
        }
    })
    

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

function getGenbaTodayData(userID, today) {
    let storageKey = `genbaToday-${userID}-${today}`;
    let data = JSON.parse(localStorage.getItem(storageKey));

    if (data) {
        return Promise.resolve(data);
    }

    return $.get('/api/genba/today/' + userID + '?today=' + today).then(result => {
        localStorage.setItem(storageKey, JSON.stringify(result));
        return result;
    });
}

function deleteLocalStorageForType(type) {
    try {
        localStorage.removeItem(`inputTypeData-${type}`);
        console.log(`Successfully deleted local storage variable for type: ${type}`);
    } catch (err) {
        console.error(`Error deleting local storage variable for type ${type}:`, err);
    }
}

function updateLocalStorageForType(type) {
    console.log(`updateLocalStorageForType : ${type}`)
    return new Promise((resolve, reject) => {
        // Fetch fresh data for the given type from the API
        $.get(`/api/${type}`, function(data) {
            try {
                // Store the data in local storage
                localStorage.setItem(`inputTypeData-${type}`, JSON.stringify(data));
                resolve(data);  // Resolve with fetched data
            } catch (err) {
                console.error(`Error updating local storage for type ${type}:`, err);
                reject(err);  // Reject with the error
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.error(`Error fetching data for type ${type}:`, errorThrown);
            reject(errorThrown);  // Reject with the error from the AJAX call
        });
    });
}

function updateGenbaData(userID) {
    // Fetch fresh data for user's genba list and global genba list
    let userGenbaPromise = $.get(`/users/info/${userID}`).then(result => {
        let genbaData = result.genba;
        localStorage.setItem(`userGenbaList-${userID}`, JSON.stringify(genbaData));
        return genbaData;
    });

    let globalGenbaPromise = $.get("/api/genba").then(result => {
        localStorage.setItem('genbaList', JSON.stringify(result));
        return result;
    });

    // Return a promise that resolves when both updates are completed
    return $.when(userGenbaPromise, globalGenbaPromise);
}

function getUserGenbaList(userID) {
    // Define the storage key for caching
    let storageKey = `userGenbaList-${userID}`;
    
    // Check if data is available in local storage
    let cachedData = JSON.parse(localStorage.getItem(storageKey));

    if (cachedData) {
        // Return the cached data as a resolved promise
        return Promise.resolve(cachedData);
    }

    // If not found in local storage, fetch from the API
    return $.get(`/users/info/${userID}`)
        .then(result => {
            // Extract the genba data from the result
            let genbaData = result.genba;

            // Cache the genba data in local storage for future use
            localStorage.setItem(storageKey, JSON.stringify(genbaData));
            return genbaData;
        })
        .catch(error => {
            console.error("Error fetching user's genba list:", error);
            throw error;  // Propagate the error so it can be handled by the caller
        });
}

function getGenbaList() {
    let storageKey = 'genbaList';
    let data = JSON.parse(localStorage.getItem(storageKey));

    if (data) {
        return Promise.resolve(data);
    }

    return $.get("/api/genba").then(result => {
        localStorage.setItem(storageKey, JSON.stringify(result));
        return result;
    });
}
function deleteGenbaListFromLocalStorage() {
    let storageKey = 'genbaList';
    try {
        localStorage.removeItem(storageKey);
        console.log(`Successfully deleted local storage variable: ${storageKey}`);
    } catch (err) {
        console.error(`Error deleting local storage variable: ${storageKey}`, err);
    }
}

function appendGenbaData(result, genbaList) {
    if (result.length > 0) {
        result.forEach(element => {
            let preGenba = genbaList.filter(genba => genba._id === element.genbaID);
            $('.genbatoday').append(`
                <button class="btn btn-success btn-sm mx-2" data-id="${element.genbaID}" data-name="${element.genbaName}">
                    ${preGenba[0].工事名}
                </button>
            `);
        });
    } else {
        $('.genbatoday').append('<span class="text-secondary" style="font-size:12px">データがございません。</span>');
    }
}

function genbatoday(userID, today) {
    $('.genbatoday').html('');
    $('.genbatodayloading').show();

    if (userID === undefined) { 
        userID = $('#userID').attr('data-value'); 
    }

    $.when(getGenbaTodayData(userID, today), getGenbaList())
        .done(function(genbaTodayData, genbaListData) {
            $('.genbatodayloading').hide();
            appendGenbaData(genbaTodayData, genbaListData);
        })
        .catch(function() {
            $('.genbatodayloading').hide();
            // Optionally, add error handling/display logic here
            console.error("Failed to fetch genba data.");
        });
}


$(document).on('click', '.genbatoday button', function () {
    let genbaID = $(this).attr('data-id')
    let genbaName = $(this).attr('data-name')
    $('select.input-genba.globalselector').val(genbaID).change()
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
    let genbaID =  $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('data-id')
    let genbaName = $('.input-genba.globalselector[data-select="genba"]').find('option:checked').attr('value')
    if (false) {
        console.log({
            event: 'genbaIchiranInit',
            genbaID: genbaID,
            genbaName: genbaName,
            today: today,
            start: start,
            end: end,
        })
    }
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
                    let preGenba = genbaList.filter(genba => genba._id === genbaName);
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
//NIPPO SHUKEI
function nipposhukeiInit() {
    //作業時間 to 日
    $.get('/api/shukei', function (data) {
        data = data[0]
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
    $.get('/api/companyShukei', async function (result) {
        result = result[0][k]
        let companies = Object.keys(result)
        let avoidthis = ['_id', 'undefined', '', 'date', 'today', 'todayJP']
        let genbaList = await $.get("/api/genba");
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
        $.get('/api/filter?startDate=' + startDate + '&endDate=' + endDate + '&genba=' + genba + '&type=' + type + '&responsible=' + responsible, async function (result) {
            console.log({
                event: 'nippoEveryInit -> GET',
                result: result.length
            })
            let genbaList = await $.get("/api/genba");

            if (result.length > 0) {
                result.forEach(data => {
                    for (let i = 1; i <= data.totalLine; i++) {
                        if (data['工事名-' + i]) {
                            let genba = genbaList.filter(genba => genba._id === data['工事名-'+i]);
                            let genbaName = '-';
                            if (genba[0]) {
                                genbaName = genba[0].工事名
                            }
                            if (data['作業名-' + i] == undefined) { data['作業名-' + i] = '-' }
                            if (data['日-' + i] == undefined) { data['日-' + i] = '-' }
                            if (data['作業内容-' + i] == undefined) { data['作業内容-' + i] = '-' }
                            let content = '<tr data-id="' + data._id + '" data-value="' + i + '" class="element removeThisIdHide">'
                            content += '<td class="date" data-value="' + data.日付 + '" >' + data.todayJP + '</td>'
                            content += '<td class="responsible" data-value="' + data.userID + '"" style="cursor:pointer" >' + data.userName + '</td>'
                            content += '<td class="genba" data-value="' + data['工事名-' + i] + '" style="cursor:pointer" >' + genbaName + '</td>'
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

    let userID =  $('#userID').attr('data-value');
    if (!!document.querySelector(".table#genba")) {
        SUA({ event: '現場一覧ページ' })
        let genbaSelect = $('.table#genba')
        $.get("/api/genba", function (data) { // api.js : router.get('/:dbName')
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
        // let userID = $('#userID').attr('data-value')
        let genbaID = getUrlParameter('genbaID')
        /*
        console.log({
            event:'formResponsible',
            userID:userID,
            genbaID:genbaID,
        })
        */
        $.get("/api/users", function (data) {
            let index = data.findIndex(function(element) {
                return element._id === userID;
            });
            let specificElement = data.find(function(item) {
                return item._id === userID;
            });
            if (index !== -1) {
                data.splice(index, 1);
                data.splice(0, 0, specificElement);
            }

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
            deleteGenbaListFromLocalStorage();
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

    $.fn.autoKana('input[name="el"]', 'input[name="業社名kana"]');

    let companyID = getUrlParameter('companyID')
    if (!!document.querySelector(".table#company")) {
        SUA({ event: '業社一覧ページ' })
        let cSelector = $('.table#company')
        $.get("/api/company", function (data) {
            data = sortit(data, '業社名kana')
            for (let index = 0; index < data.length; index++) {
                let element = data[index]
                // $.get( "/api/company", function( data ) {
                //     data=sortit(data,'業社名kana')
                //     for(let index=0;index<data.length;index++){
                //         let element=data[index]
                //         if(element.el ){
                //             let col1 = element.el || ""
                //             let col2 = element.sub || ""
                //             let col3 = element['業社名kana'] || ""
                //             if(Array.isArray(col2)){
                //                 col2 = col2.filter(String)
                //             }
                //             cSelector.find('tbody').append('<tr class="clickable" data-link="/dashboard/settings/company?companyID='+element._id+'"><td>'+col1+'</td><td>'+col3+'</td><td>'+col2+'</td></tr>')
                //         }
                //     };
                // });

                if (element.el) {
                    let col1 = element.el || ""
                    let col2 = element['業社名kana'] || ""
                    let col3 = element.sub || [];
                    if (Array.isArray(col3)) {
                        col3 = col3.map(item => item.name).filter(String);
                    }                    
                    cSelector.find('tbody').append('<tr class="clickable" data-link="/dashboard/settings/company?companyID=' + element._id + '"><td>' + col1 + '</td><td>' + col2 + '</td><td>' + col3 + '</td></tr>')
                }
            };
        });
    }
    //koushuCheckList
    if (!!document.querySelector('#koushuCheckList')) {

        fetchAndCache('koushu')
            .then(koushu =>{
                koushu.forEach((element, index) => {
                    if (element.el) {
                        $('#koushuCheckList').append('<div class="form-check col-3" ><input class="form-check-input" type="checkbox" name="sub" id="checkbox_' + element._id + '" value="' + element._id + '" data-id="' + element._id + '"><label class="form-check-label" for="checkbox_' + element._id + '">' + element.el + '</label></div>')
                    }
                });
            })

        if (companyID != 0) {
            $('#submit_company').attr('data-action', '/api/edit/company?elementTypeID=' + companyID)
            $.get('/api/company?elID=' + companyID + '&getGenba=true', function (result) {
                if (result.company) {
                    const company = result.company;
                    SUA({ event: '業社編集ページ', detail: company.el })
                    if (company.sub) {
                        if (Array.isArray(company.sub)) {
                            company.sub.forEach(function (koushu) {
                                $('#koushuCheckList').find('.form-check input[value="' + koushu.id + '"]').attr('checked', true)
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
                    if (result.company.genbaList) {
                        let genbaContent = "";
                        for (let i = 0; i < result.company.genbaList.length; i++) {
                            $.get(`/api/genba?elID=${result.company.genbaList[i]}`,function(genba){
                                genbaContent += '<a class="mr-5 text-nowrap" href="/dashboard/settings/genba?genbaID=' + genba._id + '">' + genba['工事名'] + '</a>';
                                $(".company-genba").html(genbaContent);
                            })
                        }
                       
                    }
                }
            })
        } else {
            SUA({ event: '新規業社ページ' })
            $('#submit_company').attr('data-action', '/api/addone/company')
        }
        $('#companyDelete').attr('action', '/api/delete/company?elementTypeID=' + companyID)
        
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
                updateGenbaCheckList(result)
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
                        list_content_item += '<div class="list_container row px-3 py-2 border rounded-0 m-0 bg-white w-100" data-time="' + xtime + '" data-value="' + n + '">'
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
    if (!document.querySelector('#userActivity') && !!document.querySelector('#editUsers')) {
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
            updateGenbaCheckList(result)
            //Delete button
            if (!!document.querySelector('#usersDelete')) {
                $('#usersDelete').attr('action', '/users/delete?userID=' + userID)
            }

            $('#editUsers .loading').hide()
            $('#editUsers .card-body').show()
        })

        updateGenbaData(userID)

    }
}
function updateGenbaCheckList(result) {
    const genbaCheckList = $('#genbaCheckList');

    if (!genbaCheckList.length) return;

    if (genbaCheckList.hasClass('done')) {
        resetCheckList(genbaCheckList);
        checkSelectedGenba(result, genbaCheckList);
    } else {
        fetchAndPopulateGenba(genbaCheckList, result);
    }
}

function resetCheckList(checkList) {
    checkList.find('.form-check input').prop('checked', false);
}

function checkSelectedGenba(result, checkList) {
    if (result && result.genba) {
        result.genba.forEach(genba => {
            checkList.find(`.form-check input[value="${genba.id}"]`).prop('checked', true);
        });
    }
}

function fetchAndPopulateGenba(checkList, result) {
    $.get("/api/genba", function (data) {
        data.forEach((element) => {
            if (element.工事名) {
                const checkItem = `
                    <div class="form-check col-3">
                        <input class="form-check-input" type="checkbox" name="genba" id="checkbox_${element._id}" value="${element._id}" data-id="${element._id}">
                        <label class="form-check-label" for="checkbox_${element._id}">${element.工事名}</label>
                    </div>`;
                checkList.append(checkItem);
            }
        });
        checkList.addClass('done');
        checkSelectedGenba(result, checkList);
    });
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
        deleteLocalStorageForType($(this).attr('data-type'));
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
// Main function to display the period list
function displayPeriodList(period) {
    const $globalSelector = $('select.period-list.globalselector');

    // Check if the global selector is already initialized
    if ($globalSelector.length > 0 && !$globalSelector.hasClass('initialized')) {
        //console.log("Initializing period list.");

        // Mark the global selector as initialized
        $globalSelector.addClass('initialized');

        // Determine the period to use
        determinePeriod(period, function(shimebi) {
            // Populate the period list
            mainPeriodList(shimebi);
        });

        // Set the checked option as selected and trigger change event
        $globalSelector.find('option:checked').prop('selected', true).change();
    }
}

// Function to determine the period to use
function determinePeriod(period, callback) {
    if (period === undefined || isNaN(period)) {
        console.log("Fetching period from global settings.");
        
        // Fetch period from global settings if not provided or invalid
        $.get("/api/globalsetting", function (data) {
            const shimebi = parseInt(data[0].period);
            callback(shimebi);
        });
    } else {
        //console.log("Using provided period.");
        
        // Use the provided period
        const shimebi = parseInt(period);
        callback(shimebi);
    }
}

function mainPeriodList(shimebi) {
        let date = new Date()
        $('.period-list').html('')
        for (let i = -1; i <= 0; i++) {
            for (let month = 0; month <= 11; month++) {
                let period_start = new Date(date.getFullYear() + i, month, (shimebi + 1))
                let period_end = new Date(date.getFullYear() + i, month + 1, shimebi)
                if (period_start <= date) {
                    let d_period_start = period_start.getFullYear() + '年' + (period_start.getMonth() + 1) + '月' + (period_start.getDate()) + '日';
                    let d_period_end = period_end.getFullYear() + '年' + (period_end.getMonth() + 1) + '月' + (period_end.getDate()) + '日';
                    let s_period_start = (period_start.getMonth() + 1) + '/' + period_start.getDate() + '/' + period_start.getFullYear();
                    let s_period_end = (period_end.getMonth() + 1) + '/' + period_end.getDate() + '/' + period_end.getFullYear();
                    if (!!document.querySelector('#new_dashoboard_content') || !!document.querySelector('#new_dashoboard_content_admin')) {
                        if (date <= period_end || date.getFullYear() == period_end.getFullYear() && date.getMonth() == period_end.getMonth() && date.getDate() == period_end.getDate()) {
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

        $('select.period-list').niceSelect('update')
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
    genbaOptionSelect()
    
    displayMainContent()
    displayPeriodList(20)
    //UPDATE ICHIRAN FROM SELECT
    $(document).on('change', '.period-list.globalselector', function () {
        console.log({ event: 'change .period-list.globalselector' })
        ichiranManage()
    })
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
    // new[monkey] - need comment
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
    // new[monkey]
    $('body').on('click', '.clickable-no-hover', function () {
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
        let switchview = localStorage.getItem('switchview');
        
        if (switchview === null) {
            localStorage.setItem('switchview', $('.switchview .switcher.on').attr('data-value'));
            $('.' + $('.switchview .switcher.on').attr('data-value')).show();
        } else {
            $('.switchview .switcher').each(function () {
                $(this).removeClass('on');
            });
            $('.switchview .switcher[data-value="' + switchview + '"]').addClass('on');
            $('.switchview .switcher').each(function () {
                if ($(this).hasClass('on')) {
                    $(this).show();
                    $('.' + $(this).attr('data-value')).show();
                    localStorage.setItem('switchview', $(this).attr('data-value'));
                } else {
                    $(this).hide();
                }
            });
        }
        $('.switchview').on('click', function () {
            $('.display').hide();
            $('.switchview .switcher').each(function () {
                $(this).toggleClass('on');
                if ($(this).hasClass('on')) {
                    $(this).show();
                    $('.' + $(this).attr('data-value')).show();
                    localStorage.setItem('switchview', $(this).attr('data-value'));
                    let view = $(this).attr('data-value');
                    if (view === 'view-list') {
                        view = 'リスト表示に';
                    } else {
                        view = '日付表示に';
                    }
                    SUA({ event: '表示切り替え', detail: view });
                } else {
                    $(this).hide();
                }
            });
        });
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
    loadinput(['koushu', 'type', 'place', 'company'])
    initTimeInput()
    initGenbaInput(callback)
}
function initTimeInput() {
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
}

function initGenbaInput(callback) {
    // Check if '.input-genba' exists in the document
    if (!!document.querySelector('.input-genba')) {
        let userIDs = [];

        // Collect all unique user IDs from the select elements
        $(document).find('select.input-genba').each(function () {
            if (!$(this).hasClass('init-on')) {
                let userID = $(this).attr('data-userid');
                if (!userIDs.includes(userID) && userID !== undefined) {
                    userIDs.push(userID);
                }
            }
        });
        // Initialize genba if no user IDs are found
        if (userIDs.length === 0) {
            genbaInit($(document).find('select.input-genba'));
            return;
        }

        // Process each user ID
        userIDs.forEach(userID => {
            processUserID(userID, function () {
                if (callback) { callback() }  
            });
        });
    }
}

// Function to process each user ID
function processUserID(userID, callback) {
    let allSelect = $(document).find(`select.input-genba[data-userid="${userID}"]`);
    
    getUserGenbaList(userID)
        .then(userGenbaList => {
            processDateAndGenba(userID, userGenbaList, allSelect, function() {
                // Callback when all processing is done
                if (typeof callback === 'function') {
                    callback();
                }
            });
        })
        .catch(error => {
            console.error("Failed to get user's genba list:", error);
            // Handle any error-specific logic here, if necessary
        });
}


// Function to get the formatted date for "yesterday"
function getYesterdayFormatted(dateInput) {
    let yesterday = moment(dateInput).subtract(1, 'days');
    return `${yesterday.month() + 1}/${yesterday.date()}/${yesterday.year()}`;
}

// Function to process date and Genba
function processDateAndGenba(userID, userGenbaList, allSelect, callback) {
    let dateInput = new Date($('.input-date.globalselector').data('date'));
    let ct = getYesterdayFormatted(dateInput);

    // Retrieve and parse the string back to an object
    let genbaLocalStorageKey = `genbaYesterday-${userID}-${ct}`;
    let genbaYesterday = JSON.parse(localStorage.getItem(genbaLocalStorageKey)) || null;
    
    if (genbaYesterday) {
        populateSelectOptions(userGenbaList, allSelect, genbaYesterday, callback);
    } else {
        // Fetch Genba info for yesterday
        $.get(`/api/genba/today/${userID}?today=${ct}`, function (result) {
            localStorage.setItem(genbaLocalStorageKey, JSON.stringify(result));
            populateSelectOptions(userGenbaList, allSelect, result, callback);
        });
    }
}
// Function to populate the select options
function populateSelectOptions(userGenbaList, allSelect, genbaYesterday, callback) {
    const genbaYesterdayIDs = genbaYesterday.map(obj => obj.genbaID);

    if (userGenbaList.length > 0) {
        getGenbaList().then(data => {
            allSelect.each(function() {
                let genbaSelect = $(this)
                genbaSelect.html('')
                data = sortit(data, '工事名kana')

                for (let index = 0; index < data.length; index++) {
                    let element = data[index];
                    if (element.工事名 && userGenbaList.some(genba => genba.name === element.工事名)) {
                        if (genbaYesterdayIDs.includes(element._id)) {
                            genbaSelect.prepend(`<option value="${element._id}" data-id="${element._id}">${element.工事名}</option>`);
                        } else {
                            genbaSelect.append(`<option value="${element._id}" data-id="${element._id}">${element.工事名}</option>`);
                        }
                    }
                }

                if (!genbaSelect.hasClass('globalselector')) {
                    if (!genbaSelect.attr('value')) {
                        genbaSelect.val('')
                    } else {
                        genbaSelect.val(genbaSelect.attr('value'))
                    }
                } else {
                    if (!genbaSelect.hasClass('init-on')) {
                        genbaSelect.addClass('init-on')
                        let selectid = 0
                        if (getUrlParameter('genbaID') != undefined) {
                            selectid = getUrlParameter('genbaID')
                        }
                        if ((selectid == 0) || selectid == undefined) {
                            genbaSelect.val(genbaSelect.find("option:first").val()).change();
                        } else {
                            genbaSelect.val(genbaSelect.find('option[data-id="' + selectid + '"]').val()).change();
                        }
                    }
                }

                genbaSelect.niceSelect('update')
            });

            // Callback when all options are populated
            if (typeof callback === 'function') {
                callback();
            }
        }).catch(error => {
            console.error("Error fetching genba list:", error);
            genbaInit(allSelect); // Assuming you want to call genbaInit on error
        });
    } else {
        genbaInit(allSelect)
    }
}

// Function to initialize Genba if no user IDs are found
function genbaInit(allSelect) {
    console.log({
        event: 'genbaInit',
        allSelect: allSelect
    });
    
    allSelect.each(function () {
        let genbaSelect = $(this);
        if (!$(this).hasClass('init-on')) {
            getGenbaList()
                .then(data => {
                    data = sortit(data, '工事名kana');
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index];
                        if (element.工事名) {
                            genbaSelect.append(`<option value="${element._id}" data-id="${element._id}">${element.工事名}</option>`);
                        }
                    }
                    
                    if (!genbaSelect.hasClass('globalselector')) {
                        genbaSelect.val('');
                        if (!genbaSelect.attr('value')) {
                            genbaSelect.val('');
                        } else {
                            genbaSelect.val(genbaSelect.attr('value'));
                        }
                        genbaSelect.niceSelect('update');
                    } else {
                        if (!genbaSelect.hasClass('init-on')) {
                            genbaSelect.addClass('init-on');
                            genbaSelect.val(genbaSelect.find("option:first").val()).change();
                        }
                    }
                })
                .catch(error => {
                    console.error("Failed to get genba list:", error);
                    // Handle any error-specific logic here, if necessary
                });
        }
    });
}

function fetchAndCache(type) {
    let storageKey = `inputTypeData-${type}`;
    let cachedData = JSON.parse(localStorage.getItem(storageKey));

    if (cachedData) {
        return Promise.resolve(cachedData);
    }

    return $.get(`/api/${type}`).then(result => {
        localStorage.setItem(storageKey, JSON.stringify(result));
        return result;
    });
}

function loadinput(types) {
    for (let i = 0; i < types.length; i++) {
        let type = types[i];
        if (!!document.querySelector(`select.input-${type}`)) {
            $(document).find(`select.input-${type}`).each(function() {
                let sl = $(this);

                fetchAndCache(type)
                    .then(data => {
                        sl.html('');
                        if (data.length > 0) {
                            data = sortit(data);
                            data.forEach(element => {
                                sl.append(`<option value="${element.el}">${element.el}</option>`);
                            });
                            if (!sl.attr('value')) {
                                sl.val('');
                            } else {
                                sl.val(sl.attr('value'));
                            }
                            let nc = sl.find('option[value="その他"]');
                            sl.append(nc.clone());
                            nc.remove();
                        }
                        sl.niceSelect('update');
                    })
                    .catch(error => {
                        console.error("Failed to load input data:", error);
                    });
            });
        }
    }
}
 

function initGlobalSelector() {

    if (!!document.querySelector('.input-responsible')) {
        let userID = $('#userID').attr('data-value')
        if (getUrlParameter('selectid') != undefined && getUrlParameter('selectid')) {
            userID = getUrlParameter('selectid')
        }
        if (getUrlParameter('u') != undefined && getUrlParameter('u')) {
            userID = getUrlParameter('u')
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
            $('form').find('.input-date').val(fullDay);
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
            let content = '<select class="input-temp text-center w-100" id="modalSelect" data-input="input-company" data-name="業社名-'+num+'" style="display:none;font-size: 11px;" value="'+compnayValue+'" onchange="inputTemp(this)">'
            results.forEach(element => {
                if (element.sub != undefined) {
                    if ((!Array.isArray(element.sub))) {
                        element.sub = element.sub.split(' ')
                    }
                    const containsValue = element.sub.some(obj => obj.name === value);
                    if (containsValue) {
                        result.push(element.el)
                        let checking = ''; if (compnayValue == element.el) { checking = 'selected' }
                        content += '<option value="' + element.el + '" ' + checking + '>' + element.el + '</option>'
                    }
                }
            });
            content += '<option value="modal">'+'業者名を追加する'+'</option>'
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
    var selectElement = document.getElementById("modalSelect");
    var selectedOption = selectElement.options[selectElement.selectedIndex].value;
    
    if (selectedOption === "modal") {
      // Open the modal
      $('#myModal').modal('show');
    }

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
function setLocalStorageItem(c_name, c_val) {
    // Store the value in local storage
    localStorage.setItem(c_name, c_val);

    // Create an info object based on data attributes
    let info = {};
    info.event = $('#' + c_val).attr('data-sua-event');
    info.detail = $('#' + c_val).attr('data-sua-detail') || '-';

    // Call the SUA function with the info object
    SUA(info);
}

function setNippoView() {
    // Check if 'nippoview' is stored in local storage
    const nippoViewValue = getUrlParameter('nippoview') || localStorage.getItem('nippoview');
    // If the 'nippoview' value exists in local storage
    if (nippoViewValue !== null) {
      // Trigger a click event on the element with the ID stored in 'nippoview'
      $('#nippoview').find('#' + nippoViewValue).click();
    }
  }
  

function westernDate(item){
    const date = new Date(item);
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
    };

    return formattedDate = date.toLocaleDateString('ja-JP', options);
    // var dateComponents = date.split(/[年月日()]/).filter(Boolean);

    // // Create a new Date object with the splitted components
    // var dateObject = new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);

    // // Format the date as desired
    // return formattedDate = `${dateObject.getFullYear()}/${(dateObject.getMonth() + 1).toString().padStart(2, '0')}/${dateObject.getDate().toString().padStart(2, '0')}(${getDayOfWeek(dateObject)})`;

    // // Function to get the day of the week from a Date object
    // function getDayOfWeek(date) {
    //     var days = ['日', '月', '火', '水', '木', '金', '土'];
    //     return days[date.getDay()];
    // }
}
function sortTableByDate(tableId, columnIndex, arrowUpId, arrowDownId) {
    const table = document.getElementById(tableId);

    if (!table) return; // Exit if table not found
    
    const rows = Array.from(table.getElementsByTagName('tr'));
    if (rows.length <= 1) return; // Exit if not enough rows to sort

    function compareDates(a, b) {
        let dateStringA = a.cells[columnIndex].innerText.split('(')[0];
        let dateStringB = b.cells[columnIndex].innerText.split('(')[0];
        
        let dateA = new Date(dateStringA);
        let dateB = new Date(dateStringB);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.error("Failed to parse dates:", dateStringA, dateStringB);
            return 0;
        }
        
        return dateA - dateB;
    }

    // Default sortOrder to 'desc' if not set
    let sortOrder = table.dataset.sortOrder || 'desc';
    const sortedRows = rows.slice(1).sort(compareDates);
    
    if (sortOrder === 'asc') {
        sortedRows.reverse();
        sortOrder = 'desc';
    } else {
        sortOrder = 'asc';
    }
    
    // Update sortOrder for the next click
    table.dataset.sortOrder = sortOrder;
    // Assuming your table structure includes a tbody element
    const tbody = table.getElementsByTagName('tbody')[0];

    // Re-append the sorted rows back into the tbody
    sortedRows.forEach(row => tbody.appendChild(row));
    
    // Update arrow display
    const arrowUp = document.getElementById(arrowUpId);
    const arrowDown = document.getElementById(arrowDownId);
    if (arrowUp) arrowUp.style.display = sortOrder === 'desc' ? 'none' : 'inline';
    if (arrowDown) arrowDown.style.display = sortOrder === 'desc' ? 'inline' : 'none';
}



// New Dashboard Page Init
function newDashboardCalendarInit(userID, today, start, end) {
    let altogetherWorkDays = 0;

    const preStartDateForGetData = new Date(start);
    const startDateForGetData = preStartDateForGetData.getMonth() + '/' + '10/' + preStartDateForGetData.getFullYear();
    $("#calendar_nippo").html('<div class="d-flex justify-content-center" style="align-items:center;height:300px;"><div class="spinner-border" role="status"><div class="sr-only">ローディング...</div></div></div>');
    $.get('/api/nippoichiran?userID=' + userID + '&today=' + today + '&start=' + startDateForGetData + '&end=' + end, function (res) {
        let calendar = '<div class="months"><div class="month"><div class="days"><div class="day weekLabel weekd0" title="Sunday">日</div><div class="day weekLabel weekd1" title="Monday">月</div><div class="day weekLabel weekd2" title="Tuesday">火</div><div class="day weekLabel weekd3" title="Wednesday">水</div><div class="day weekLabel weekd4" title="Thursday">木</div><div class="day weekLabel weekd5" title="Friday">金</div><div class="day weekLabel weekd6" title="Saturday">土</div>';
        let result = []
        if (res) {
            result = res;
        }
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
        // } else {
        //     calendar += '<div style="height:50%; width: 100%;">データなし</div>'
        // }
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
            if (customHolidays["year" + year.toString()]) {
                let currentYear = year;
                const thisDate = currentDay;
                if (nationalHolidays[thisDate.getMonth() + 1] && nationalHolidays[thisDate.getMonth() + 1].length) {
                    if (nationalHolidays[thisDate.getMonth() + 1].indexOf(thisDate.getDate()) > -1) {
                        if (customHolidays["year" + currentYear].legalHolidays.week.length ) {
                            if (customHolidays["year" + currentYear].legalHolidays.week.indexOf("7") > -1) {
                                if (classes.indexOf("legalHoliday")  < 0 ) classes.push("legalHoliday");
                                if (classes.indexOf("scheduledHoliday") > -1) classes.splice(classes.indexOf("scheduledHoliday"), 1);
                            }
                        }
                        if ( customHolidays["year" + currentYear].scheduledHolidays.week.length ) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.week.indexOf("7") > -1) {
                                if (classes.indexOf("scheduledHoliday") ) classes.push("scheduledHoliday");
                                if (classes.indexOf("legalHoliday") > -1) classes.splice(classes.indexOf("legalHoliday"), 1);
                            }
                        }
                    }
                }
                if (customHolidays["year" + currentYear].legalHolidays.week && customHolidays["year" + currentYear].legalHolidays.week.indexOf(thisDate.getDay().toString()) > -1 ) {
                    if (classes.indexOf("legalHoliday") < 0 ) classes.push("legalHoliday");
                    if (classes.indexOf("scheduledHoliday") > -1) classes.splice(classes.indexOf("scheduledHoliday"), 1);
                }
                if (customHolidays["year" + currentYear].legalHolidays.days && customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)].length) {
                    if (customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                        if (classes.indexOf("legalHoliday")  < 0 ) classes.push("legalHoliday");
                        if (classes.indexOf("scheduledHoliday") > -1) classes.splice(classes.indexOf("scheduledHoliday"), 1);
                    }
                }
                if (customHolidays["year" + currentYear].scheduledHolidays.week && customHolidays["year" + currentYear].scheduledHolidays.week.indexOf(thisDate.getDay().toString()) > -1 ) {
                    if (classes.indexOf("scheduledHoliday") < 0 ) classes.push("scheduledHoliday");
                    if (classes.indexOf("legalHoliday") > -1) classes.splice(classes.indexOf("legalHoliday"), 1);
                }
                if (customHolidays["year" + currentYear].scheduledHolidays.days && customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)].length) {
                    if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                        if (classes.indexOf("scheduledHoliday") < 0 ) classes.push("scheduledHoliday");
                        if (classes.indexOf("legalHoliday") > -1) classes.splice(classes.indexOf("legalHoliday"), 1);
                    }
                }
                if (customHolidays["year" + currentYear].yearEndAndNewYear == "1") {
                    if (
                        (thisDate.getMonth() + 1) == 1 &&
                        (thisDate.getDate() >= 1 && thisDate.getDate() < 4) ||
                        (thisDate.getMonth() + 1) == 12 &&
                        (thisDate.getDate() > 28 && thisDate.getDate() <= 31)
                    ) {
                        if (classes.indexOf("scheduledHoliday") < 0 ) classes.push("scheduledHoliday");
                        if (classes.indexOf("legalHoliday") > -1) classes.splice(classes.indexOf("legalHoliday"), 1);
                    }
                }
                if(customHolidays["year" + currentYear].workDays && customHolidays["year" + currentYear].workDays["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].workDays["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                    if (classes.indexOf("scheduledHoliday") > -1) classes.splice(classes.indexOf("scheduledHoliday"), 1);
                    if (classes.indexOf("legalHoliday") > -1) classes.splice(classes.indexOf("legalHoliday"), 1);
                }
            }
            let currentWorkData = [];
            if (data.length) {
                currentWorkData = data.filter(item =>
                    new Date(item.today).getFullYear() === year &&
                    new Date(item.today).getMonth() === month &&
                    new Date(item.today).getDate() === d
                )                
            }
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
                day.setAttribute("href", `/dashboard/input_nippo?nippoview=nav-nippo-tab&y=${year}&m=${month + 1}&d=${d}`);

                if (!currentWorkData.length) {
                    mainContent = ["日報未入力"];
                    mainClass = "not-completed";
                    extraContent = "0日";
                } else {
                    if (currentWorkData[0].totalLine) {
                        for (let n = 1; n <= currentWorkData[0].totalLine; n++) {
                            let work = "";
                            if (currentWorkData[0]['作業内容-' + n]) {
                                work = currentWorkData[0]['作業内容-' + n].length > 6 ? `${currentWorkData[0]['作業内容-' + n].slice(0, 6)}...` : currentWorkData[0]['作業内容-' + n];
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

function newDashboardChartInit(genbaIDs, chartNo, genba, start, end) {
    console.log({genbaIDs, chartNo, genba, start, end})
    let userID = $('#userID').attr('data-value');
    const genbaID = genba._id;
    const stateDate = new Date(start);
    const endDate = new Date(end);
    if (document.getElementById('chart_group_item_' + chartNo)) {
        const startVal = stateDate.getFullYear() + '/' + (stateDate.getMonth() + 1) + '/' + stateDate.getDate();
        const endVal = endDate.getFullYear() + '/' + (endDate.getMonth() + 1) + '/' + endDate.getDate();
        $('.chart-date.start[chart-no="'+chartNo+'"]').val(startVal).change();
        $('.chart-date.end[chart-no="'+chartNo+'"]').val(endVal).change();
        $('.chart-date.start[chart-no="'+chartNo+'"]').attr('data-date', start);
        $('.chart-date.end[chart-no="'+chartNo+'"]').attr('data-date', end);
        $('.chart-date.start[chart-no="'+chartNo+'"]').datepicker('update');
        $('.chart-date.end[chart-no="'+chartNo+'"]').datepicker('update');
        $("#genbaichart" + chartNo).text(genba.工事名)
        $("#genbaichart" + chartNo).attr('data-id',genbaID);
        $("#genbaichart" + chartNo).attr('href',`/dashboard/input_nippo/?nippoview=nav-genbanippo-tab&genbaID=${genbaID}` )
    }
    let preData = {};
    let labels = [];
    let preDataSets = {};
    $.get('/api/genbaichiranDateRange?genbaID=' + genbaID + '&today=' + today + '&start=' + start + '&end=' + end, function (result) {
        if(localStorage.getItem(userID + "genba" + chartNo)) {
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
                if (document.getElementById('chart_group_item_' + chartNo)) {
                    const ctx = document.getElementById('chart_group_item_' + chartNo);
                    if (Chart.getChart('chart_group_item_' + chartNo)) {
                        const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                        existingChart.destroy();
                    }
                    new Chart(ctx, chartBarConfig);
                } else {
                    $("#chart-card-group").append(`<div class="card border-secondary mb-3" id="new_dashboard_charts_group${chartNo}" style="width: 100%;">
                        <div class="card-body px-0 py-0">
                            <span class="d-flex">
                                <h5 class="px-2 py-1" id="genbaichart${chartNo}" style="width: -webkit-fill-available;">青谷工業</h5>
                                <span class="d-flex py-2 justify-content-end mr-1" style="width: -webkit-fill-available;">
                                    <input
                                        class="chart-date start text-center"
                                        type="text"
                                        chart-no="${chartNo}"
                                        name="startDate"
                                        data-name="nippo"
                                        style="height: fit-content; width: 82px; padding-top: 2px; padding-bottom: 2px; border: gray solid 1px; border-radius: 2px; background-color: #00bbff5e;"
                                    />
                                    <span class="px-2" style="padding-top: 2px; padding-bottom: 2px;">~</span>
                                    <input
                                        class="chart-date end text-center"
                                        type="text"
                                        name="endDate"
                                        chart-no="${chartNo}"
                                        data-name="nippo"
                                        style="height: fit-content; width: 82px; padding-top: 2px; padding-bottom: 2px; border: gray solid 1px; border-radius: 2px; background-color: #00bbff5e;"
                                    />
                                    <button class="close chart-close-btn" chart-no="${chartNo}"><span aria-hidden="true">×</span></button>
                                </span>
                            </span>
                            <canvas id="chart_group_item_${chartNo}"></canvas>
                        </div>
                    </div>
                    `);

                    setTimeout(() => {
                        $('.chart-date.start[chart-no="' + chartNo + '"').datepicker({
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
                            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], ct, $('.chart-date.end').attr('data-date'));
                
                        })
                        $('.chart-date.end[chart-no="' + chartNo + '"').datepicker({
                            language: "ja",
                            format: 'yyyy/m/d',
                            autoclose: true,
                            todayHighlight: true,
                            endDate: new Date(),
                        }).on('changeDate', function (e) {
                            let dd = new Date(e.date)
                            const chartNo = Number($(this).attr("chart-no"));
                            $('.chart-date.start[chart-no="' + chartNo + '"').datepicker('setEndDate', dd);
                            let ct = (dd.getMonth() + 1) + '/' + dd.getDate() + '/' + dd.getFullYear();
                            $('.chart-date.end[chart-no="' + chartNo + '"').attr('data-date', ct);
                            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], $('.chart-date.start[chart-no="' + chartNo + '"').attr('data-date'), ct);
                        })
                        const startVal = stateDate.getFullYear() + '/' + (stateDate.getMonth() + 1) + '/' + stateDate.getDate();
                        const endVal = endDate.getFullYear() + '/' + (endDate.getMonth() + 1) + '/' + endDate.getDate();
                        $('.chart-date.start[chart-no="'+chartNo+'"]').val(startVal).change();
                        $('.chart-date.end[chart-no="'+chartNo+'"]').val(endVal).change();
                        $('.chart-date.start[chart-no="'+chartNo+'"]').attr('data-date', start);
                        $('.chart-date.end[chart-no="'+chartNo+'"]').attr('data-date', end);
                        $('.chart-date.start[chart-no="'+chartNo+'"]').datepicker('update');
                        $('.chart-date.end[chart-no="'+chartNo+'"]').datepicker('update');
                        $("#genbaichart" + chartNo).text(genba.工事名);

                        const ctx = document.getElementById('chart_group_item_' + chartNo);
                        if (Chart.getChart('chart_group_item_' + chartNo)) {
                            const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                            existingChart.destroy();
                        }
                        new Chart(ctx, chartBarConfig);
                    }, 100);
                }

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
                if (document.getElementById('chart_group_item_' + chartNo)) {
                    const ctx = document.getElementById('chart_group_item_' + chartNo);
                    if (Chart.getChart('chart_group_item_' + chartNo)) {
                        const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                        existingChart.destroy();
                    }
                    new Chart(ctx, chartBarConfig);
                } else {
                    $("#chart-card-group").append(`
                        <div class="card border-secondary mb-3" id="new_dashboard_charts_group${chartNo}" style="width: 100%;">
                            <div class="card-body px-0 py-0">
                                <span class="d-flex">
                                    <h5 class="px-2 py-1" id="genbaichart${chartNo}" style="width: -webkit-fill-available;">青谷工業</h5>
                                    <span class="d-flex py-2 justify-content-end mr-1" style="width: -webkit-fill-available;">
                                        <input
                                            class="chart-date start text-center"
                                            type="text"
                                            chart-no="${chartNo}"
                                            name="startDate"
                                            data-name="nippo"
                                            style="height: fit-content; width: 82px; padding-top: 2px; padding-bottom: 2px; border: gray solid 1px; border-radius: 2px; background-color: #00bbff5e;"
                                        />
                                        <span class="px-2" style="padding-top: 2px; padding-bottom: 2px;">~</span>
                                        <input
                                            class="chart-date end text-center"
                                            type="text"
                                            name="endDate"
                                            chart-no="${chartNo}"
                                            data-name="nippo"
                                            style="height: fit-content; width: 82px; padding-top: 2px; padding-bottom: 2px; border: gray solid 1px; border-radius: 2px; background-color: #00bbff5e;"
                                        />
                                        <button class="close chart-close-btn" chart-no="${chartNo}"><span aria-hidden="true">×</span></button>
                                    </span>
                                </span>
                                <canvas id="chart_group_item_${chartNo}"></canvas>
                            </div>
                        </div>
                    `);
                    setTimeout(() => {
                        $('.chart-date.start[chart-no="' + chartNo + '"').datepicker({
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
                            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], ct, $('.chart-date.end[chart-no="' + chartNo + '"').attr('data-date'));
                
                        })
                        $('.chart-date.end[chart-no="' + chartNo + '"').datepicker({
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
                            newDashboardChartInit(genbaIDs, chartNo, genbaIDs[chartNo], $('.chart-date.start[chart-no="' + chartNo + '"').attr('data-date'), ct);
                        })
                        const startVal = stateDate.getFullYear() + '/' + (stateDate.getMonth() + 1) + '/' + stateDate.getDate();
                        const endVal = endDate.getFullYear() + '/' + (endDate.getMonth() + 1) + '/' + endDate.getDate();
                        $('.chart-date.start[chart-no="'+chartNo+'"]').val(startVal).change();
                        $('.chart-date.end[chart-no="'+chartNo+'"]').val(endVal).change();
                        $('.chart-date.start[chart-no="'+chartNo+'"]').attr('data-date', start);
                        $('.chart-date.end[chart-no="'+chartNo+'"]').attr('data-date', end);
                        $('.chart-date.start[chart-no="'+chartNo+'"]').datepicker('update');
                        $('.chart-date.end[chart-no="'+chartNo+'"]').datepicker('update');
                        $("#genbaichart" + chartNo).text(genba.工事名);
                        const ctx = document.getElementById('chart_group_item_' + chartNo);
                        if (Chart.getChart('chart_group_item_' + chartNo)) {
                            const existingChart = Chart.getChart('chart_group_item_' + chartNo);
                            existingChart.destroy();
                        }
                        new Chart(ctx, chartBarConfig);
                    }, 100);
                }
            }
        } else {
            if ($(`#new_dashboard_charts_group${chartNo}`)) {
                $(`#new_dashboard_charts_group${chartNo}`).remove();
            }
        }
    });

}

// End New Dashboard Page Init
//  New Dashboard For Admin Page Init

async function processingDataForNewDashboardAdmin(genba, start, end, i) {
    const stateDate = new Date(start);
    const endDate = new Date(end);
    let preData = {};
    let labels = [];
    let preDataSets = [];
    const result = genba.data;
    let allPeopleNum = 0;
    const color = [
        "#FF3FA4",
        "#A8DF8E",
        "#0E21A0",
        "#FFB000",
        "#088395",
        "#E55604",
        "#9400FF",
        "#FFCC70",
        "#45FFCA",
        "#E25E3E",
    ];
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
            backgroundColor: color[i],
        };
        return {
            labels,
            dataset,
        };
    } else {
        result.forEach(data => {
            for (let n = 1; n <= parseInt(data.totalLine); n++) {
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
                let yData = Object.keys(preData);
                const dateString = (month + 1) + "/" + i + "/" + year;
                if (yData.indexOf(dateString) > -1) {
                    preDataSets.push(preData[dateString]);
                    allPeopleNum += preData[dateString];
                } else {
                    preDataSets.push(0);
                }
                // yData.forEach(element => {
                //     if (element === dateString) {
                //         const pp = preData[element];
                //         preDataSets.push(pp);
                //     } else {
                //         preDataSets.push(0);
                //     }
                // });
            }
            return array;
        }

        let dataset = {
            label: genba.label,
            data: preDataSets,
            stack: 'Stack 0',
            backgroundColor: color[i],
        };

        return {
            labels,
            dataset,
            allPeopleNum,
        };
    }
}
function drawCalendarTableForNewAdminDashboard(data, start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let tableContent = "<thead><tr>"
    for (let i = 0; i <= data.length; i++) {
        if (i === 0) {
            tableContent += "<th></th>"
        } else {
            tableContent += "<th>" + data[i - 1].user.lname + " " + data[i - 1].user.fname + "</th>"
        }
    }
    tableContent += "</tr></thead><tbody>";

    tableContent += createMonthTableContent(data, startDate, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate());
    tableContent += createMonthTableContent(data, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1), endDate.getDate());

    tableContent += "</tbody>";
    $(".calendar-table").html(tableContent);
    function createMonthTableContent(data, startDate, lastDay) {
        let tableContent = "";
        for (let i = startDate.getDate(); i <= lastDay; i++) {
            const thisDate = new Date(`${startDate.getFullYear()}/${startDate.getMonth() + 1}/${i}`);
            let firstTd = '<td>';
            if (customHolidays["year" + startDate.getFullYear().toString()]) {
                let currentYear = startDate.getFullYear().toString();
                if (nationalHolidays[thisDate.getMonth() + 1] && nationalHolidays[thisDate.getMonth() + 1].length) {
                    if (nationalHolidays[thisDate.getMonth() + 1].indexOf(thisDate.getDate()) > -1) {
                        if (customHolidays["year" + currentYear].legalHolidays.week.length ) {
                            if (customHolidays["year" + currentYear].legalHolidays.week.indexOf("7") > -1) {
                                firstTd = "<td style='color:red;' nationalHolidays>";
                            }
                        }
                        if ( customHolidays["year" + currentYear].scheduledHolidays.week.length ) {
                            if (customHolidays["year" + currentYear].scheduledHolidays.week.indexOf("7") > -1) {
                                firstTd = "<td style='color:blue;' nationalHolidays>";
                            }
                        }
                    }
                }
                if (customHolidays["year" + currentYear].legalHolidays.week && customHolidays["year" + currentYear].legalHolidays.week.indexOf(thisDate.getDay().toString()) > -1 ) {
                    firstTd = "<td style='color:red;' legalHolidaysweek>";
                }
                if (customHolidays["year" + currentYear].legalHolidays.days && customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)].length) {
                    if (customHolidays["year" + currentYear].legalHolidays.days["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                        firstTd = "<td style='color:red;' legalHolidaysDays>";
                    }
                }
                if (customHolidays["year" + currentYear].scheduledHolidays.week && customHolidays["year" + currentYear].scheduledHolidays.week.indexOf(thisDate.getDay().toString()) > -1 ) {

                    firstTd = "<td style='color:blue;' scheduledHolidaysWeek>";
                }
                if (customHolidays["year" + currentYear].scheduledHolidays.days && customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)].length) {
                    if (customHolidays["year" + currentYear].scheduledHolidays.days["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                        firstTd = "<td style='color:blue;' scheduledHolidaysDays>";
                    }
                }
                if (customHolidays["year" + currentYear].yearEndAndNewYear == "1") {
                    if (
                        (thisDate.getMonth() + 1) == 1 &&
                        (thisDate.getDate() >= 1 && thisDate.getDate() < 4) ||
                        (thisDate.getMonth() + 1) == 12 &&
                        (thisDate.getDate() > 28 && thisDate.getDate() <= 31)
                    ) {
                        firstTd = "<td style='color:red;' yearEndAndNewYear>";
                    }
                }
                if(customHolidays["year" + currentYear].workDays && customHolidays["year" + currentYear].workDays["month" + (thisDate.getMonth() + 1)] && customHolidays["year" + currentYear].workDays["month" + (thisDate.getMonth() + 1)].indexOf(thisDate.getDate().toString()) > -1) {
                    firstTd = "<td workDays>";
                }
            }
            tableContent += "<tr>" + firstTd;
            tableContent += `${thisDate.getMonth() + 1}月 ${thisDate.getDate()}日 (${weekDays[thisDate.getDay()][0]})</td>`;
            for (let j = 0; j < data.length; j++) {
                const day = document.createElement("a");
                day.setAttribute("href", `/dashboard/input_nippo?u=${data[j].user._id}&y=${startDate.getFullYear()}&m=${startDate.getMonth() + 1}&d=${i}`);
                const currentWorkData = data[j].nippo.filter(item =>
                    new Date(item.today).getFullYear() === startDate.getFullYear() &&
                    new Date(item.today).getMonth() === startDate.getMonth() &&
                    new Date(item.today).getDate() === i
                )
                if (!currentWorkData.length) {
                    day.innerHTML = "<span>&nbsp;</span>";
                } else {
                    if (currentWorkData[0].totalTime) {
                        let totalTime = 0
                        if ($.isNumeric(currentWorkData[0].totalTime) === true) {
                            totalTime = Number(currentWorkData[0].totalTime);
                            if (totalTime) day.textContent = `${totalTime}`;
                            else day.innerHTML = "<span>&nbsp;</span>";
                        } else {
                            day.innerHTML = "<span>&nbsp;</span>";
                        }
                    }
                }
                tableContent += "<td>" + day.outerHTML + "</td>";
            }
            tableContent += "</tr>";
        }
        return tableContent;
    }
}

function drawChartForNewAdminDashboard(labels, cData, allPeopleNum) {
    console.log({labels, cData, allPeopleNum})
    const data = {
        labels: labels,
        datasets: cData,
    };
    const config = {
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
    $("#admin_chart_days").text(allPeopleNum + "人");
    const ctx = document.getElementById('chart_group_item_1');
    if (Chart.getChart('chart_group_item_1')) {
        const existingChart = Chart.getChart('chart_group_item_1');
        existingChart.destroy();
    }
    new Chart(ctx, config);
}
//  End New Dashboard For Admin Page Init

// new[monkey]
// DAITYOU PAGE
function daityouGenbaInit() {
    // console.log({
    //     event: 'daityouGenbaInit'
    // })
    // 作業時間 to 日
    // $.get('/api/shukei', function (data) {
    //     data = data[0]
    //     let genbas = Object.keys(data)
    //     genbas.forEach(genba => {
    //         let shukei = data[genba]
    //         if (typeof shukei === 'object') {
    //             let content = '<tr>'
    //             content += '<td>' + genba + '</td>'
    //             content += '<td class="responsible-name">' + shukei.作業者 + '</td>'
    //             content += '<td>' + shukei.作業時間 + ' 日</td>'
    //             content += '</tr>'
    //             $('table.table.shukei tbody').append(content)


    //             let detail = shukei.detail
    //             let names = Object.keys(detail)
    //             names.forEach(name => {
    //                 let content = '<tr>'
    //                 content += '<td class="responsible">' + name + '</td>'
    //                 content += '<td>' + genba + '</td>'
    //                 content += '<td>' + detail[name] + ' 日</td>'
    //                 content += '</tr>'
    //                 $('table.table.genba tbody').append(content)
    //             });
    //         }
    //     });
    //     updateUserInfo()
    //     nipposhukeiChart(data)
    //     displayShukeiPeriodList()
    //     //EXPORT CSV
    //     $('.export-shukei').on('click', function () {
    //         let win = window.open('/api/csv/shukeiCSV')
    //     })
    //     $('.export-genba').on('click', function () {
    //         let win = window.open('/api/csv/genbasCSV')
    //     })
    // })
    var data = null;
    daityouGenbaChart(data);
}

function daityouGenbaChart(data) {
    let hasDrawnChart1 = false;
    let hasDrawnChart2 = false;
    let hasDrawnChart3 = false;
    $("#daityouGenbaChartBar1").resize(() => {
        if ($("#daityouGenbaChartBar1").width() == 0 || $("#daityouGenbaChartBar1").height() == 0)
            return;

        if (hasDrawnChart1)
            return;
        
        hasDrawnChart1 = true;
        var d1 = [["売上", 40000000],["原価", 80000000],["粗利益", 120000000]];
        $.plot(
            "#daityouGenbaChartBar1", [{
                data: d1,
                color: "#00b0f0"
            }], 
            {
                series: {
                    bars: {
                        align: "center",
                        lineWidth: 0,
                        show: !0,
                        barWidth: .8,
                        fill: .9
                    }
                },
                grid: {
                    borderColor: "#ddd",
                    borderWidth: 1,
                    hoverable: !0
                },
                
                tooltip: true,
                tooltipOpts: {
                    content: '%y'
                },
            
                xaxis: {
                    tickColor: "#ddd",
                    mode: "categories"
                },
                yaxis: {
                    tickColor: "#ddd"
                },
                shadowSize: 0
            }
        );
    });

    $("#daityouGenbaChartBar2").resize(() => {
        if ($("#daityouGenbaChartBar2").width() == 0 || $("#daityouGenbaChartBar2").height() == 0)
            return;

        if (hasDrawnChart2)
            return;
        
        hasDrawnChart2 = true;
        var d1 = [["シマダタイル", 60000000],["㈱ビルド伸", 16000000],["SPEC合同会社", 14000000],
                ["日添ブリキ店", 12000000],["(有)寿石油店", 11000000],["(有)木岡建材店", 9000000],
                ["(有)平野ブリキ店", 8000000],["(有)徳重工業", 6000000],["(有)杉原組", 5800000],
                ["(有)杉本電機", 4000000],["(有)浜田鉄筋工業", 3000000],["(有)アクアテック", 2000000],
                ["横河システム建築", 2000000],["㈱大萬", 1800000],["昇和㈱", 1500000],
                ["㈱ハマキャスト", 1200000],["㈱今木鉄工", 1000000],["佐々木工業", 90000]];
        // var d1 = [];
        // var i;
        // for (i = 0; i < 20; i++) {
        //     // d1.push([i, "" + i]);
        //     d1.push(["シマダタ" + i, i]);
        // }

        $.plot(
            "#daityouGenbaChartBar2", [{
                data: d1,
                color: "#00b0f0"
            }], 
            {
                series: {
                    bars: {
                        align: "center",
                        lineWidth: 0,
                        show: !0,
                        barWidth: .8,
                        fill: .9
                    }
                },
                grid: {
                    borderColor: "#ddd",
                    borderWidth: 1,
                    hoverable: !0
                },
                
                tooltip: true,
                tooltipOpts: {
                    content: '%x: %y'
                },
            
                xaxis: {
                    tickColor: "#ddd",
                    mode: "categories"
                },
                yaxis: {
                    tickColor: "#ddd"
                },
                shadowSize: 0
            }
        );
    });

    $("#daityouGenbaChartBar3").resize(() => {
        if ($("#daityouGenbaChartBar3").width() == 0 || $("#daityouGenbaChartBar3").height() == 0)
            return;

        if (hasDrawnChart3)
            return;
        
        hasDrawnChart3 = true;

        var s1 = [["2021年 9月", 0],["10月", 0],["11月", 0],["12月", 1000000],["2021年 1月", 3000000],["2月", 12700000],["3月", 37450000],["4月", 37500000],["5月", 20000000],["6月", 14000000],["7月", 5000],["8月", 0]];

        var s2 = [["2021年 9月", 0],["10月", 0],["11月", 0],["12月", 1000],["2021年 1月", 8000000],["2月", 800000],["3月", 0],["4月", 50000000],["5月", 0],["6月", 0],["7月", 14000000],["8月", 0]];

        $.plot("#daityouGenbaChartBar3", [{
            data: s1,
            label: "原価合計",
            color: "#0093fb"
        },{
            data: s2,
            label: "売上合計",
            color: "#3cd133"
        }], {
            series: {
                lines: {
                    show: !0,
                    lineWidth: 2
                },
                points: {
                    show: !0,
                    radius: 4,
                    fill: !0,
                    fillColor: "#ffffff"
                }
            },
            grid: {
                borderColor: "#ddd",
                borderWidth: 1,
                hoverable: !0
            },
            tooltip: !0,
            tooltipOpts: {
                content: "%y"
            },
            xaxis: {
                tickColor: "#ddd",
                mode: "categories"
            },
            yaxis: {
                tickColor: "#ddd"
            },
            shadowSize: 0
        });
    });

}

function daityouSiharaIchiran() {
}