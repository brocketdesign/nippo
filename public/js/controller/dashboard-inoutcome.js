$(document).ready(async function () {

    const LIMIT = 30
    let initQuery = {offset: 0, limit: LIMIT}
    let currQuery = {}
    let prevQuery = {}
    let currRows = 0

    //NIPPO FORM PAGE
    if (!!document.querySelector('#inoutcomePage')) {
        inputInit()
        setTimeout(() => { initForm() }, 1000)
        SUA({ event: '入出金管理ページ' })
    }

    function inputInit() {

        // Global Selectors

        // if (document.querySelector('.input-kouza')) {
        //     initSelectKouza($(document).find('select.input-kouza'))
        // }

        if (document.querySelector('.input-torihiki')) {
            initSelectTorihiki($(document).find('select.input-torihiki'))
        }

        if (document.querySelector('.input-hattyu')) {
            initSelectHattyu($(document).find('select.input-hattyu'))
        }

        if (document.querySelector('.input-gyousha')) {
            initSelectGyousha($(document).find('select.input-gyousha'))
        }

        // Element Selectors

        if (document.querySelector('.input-kanjoukamoku')) {
            initSelectKanjoukamoku($(document).find('select.input-kanjoukamoku'))
        }

        if (document.querySelector('.input-genba-daityou')) {
            initSelectGenba($(document).find('select.input-genba-daityou'))
        }

        if (document.querySelector('.input-zeiritu')) {
            initSelectZeiritu($(document).find('select.input-zeiritu'))
        }

        if (document.querySelector('.label-subtotal')) {
            initLabelSubTotalPrice($(document).find('.label-subtotal'))
        }

        if (document.querySelector('.label-totalprice')) {
            initLabelTotalPrice($(document).find('.label-totalprice'))
        }

        if (document.querySelector('.input-sateiprice')) {
            initInputMask();
        }

        // Date

        if (document.querySelector('.input-date-inoutcome')) {
            initDate($(document).find('.input-date-inoutcome'))
        }

        if (document.querySelector('.input-date-filter')) {
            initDate($(document).find('.input-date-filter'))
        }

        if (document.querySelector('#inoutcome-filtered-tbody')) {
            initTable()
        }

        // Filter
        if (document.querySelector('#filter-panel')) {
            initKanjoukamokuFilter()
        }
        
    }

    function initSelectKouza(allSelect) {
        // console.log({
        //     event: 'kouzaInit'
        // })
        allSelect.each(function () {
            let kouzaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/kouza", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            kouzaSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!kouzaSelect.hasClass('globalselector')) {
                        kouzaSelect.val('')
                        if (!kouzaSelect.attr('value')) {
                            kouzaSelect.val('')
                        } else {
                            kouzaSelect.val(kouzaSelect.attr('value'))
                        }
                        kouzaSelect.niceSelect('update')
                    } else {
                        if (!kouzaSelect.hasClass('init-on')) {
                            kouzaSelect.addClass('init-on')
                            kouzaSelect.val(kouzaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectTorihiki(allSelect) {
        // console.log({
            // event: 'torihikiInit'
        // })
        allSelect.each(function () {
            let torihikiSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/daityou/hattyu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        torihikiSelect.append('<option value="' + element.発注者 +'" data-id="' + element._id+'">' + element.発注者+' </option>')
                    }
                    torihikiSelect.val('')
                    if (!torihikiSelect.attr('value')) {
                        torihikiSelect.val('')
                    } else {
                        torihikiSelect.val(torihikiSelect.attr('value'))
                    }
                    torihikiSelect.niceSelect('update')
                })

                $.get("/api/company", function (data) {
                    data = sortit(data, '業社名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            torihikiSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    torihikiSelect.val('')
                    if (!torihikiSelect.attr('value')) {
                        torihikiSelect.val('')
                    } else {
                        torihikiSelect.val(torihikiSelect.attr('value'))
                    }
                    torihikiSelect.niceSelect('update')
                })
            }
        })
    }

    function initSelectHattyu(allSelect) {
        // console.log({
        //     event: 'hattyuInit'
        // })
        allSelect.each(function () {
            let hattyuSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/daityou/hattyu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        hattyuSelect.append('<option value="' + element.発注者 +'" data-id="' + element._id+'">' + element.発注者+' </option>')
                    }
                    if (!hattyuSelect.hasClass('globalselector')) {
                        hattyuSelect.val('')
                        if (!hattyuSelect.attr('value')) {
                            hattyuSelect.val('')
                        } else {
                            hattyuSelect.val(hattyuSelect.attr('value'))
                        }
                        hattyuSelect.niceSelect('update')
                    } else {
                        if (!hattyuSelect.hasClass('init-on')) {
                            hattyuSelect.addClass('init-on')
                            hattyuSelect.val(hattyuSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectGyousha(allSelect) {
        // console.log({
        //     event: 'gyoushaInit'
        // })
        allSelect.each(function () {
            let gyoushaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/company", function (data) {
                    data = sortit(data, '業社名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            gyoushaSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!gyoushaSelect.hasClass('globalselector')) {
                        gyoushaSelect.val('')
                        if (!gyoushaSelect.attr('value')) {
                            gyoushaSelect.val('')
                        } else {
                            gyoushaSelect.val(gyoushaSelect.attr('value'))
                        }
                        gyoushaSelect.niceSelect('update')
                    } else {
                        if (!gyoushaSelect.hasClass('init-on')) {
                            gyoushaSelect.addClass('init-on')
                            gyoushaSelect.val(gyoushaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectKanjoukamoku(allSelect) {
        // console.log({
        //     event: 'kanjoukamokuInit'
        // })
        allSelect.each(function () {
            let kanjoukamokuSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/kanjoukamoku?type=" + $(this).attr('data-name'), function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            kanjoukamokuSelect.append('<option value="' + element.el +'" data-id="' + element._id+'">' + element.el+' </option>')
                        }
                    }
                    if (!kanjoukamokuSelect.hasClass('globalselector')) {
                        kanjoukamokuSelect.val('')
                        if (!kanjoukamokuSelect.attr('value')) {
                            kanjoukamokuSelect.val('')
                        } else {
                            kanjoukamokuSelect.val(kanjoukamokuSelect.attr('value'))
                        }
                        kanjoukamokuSelect.niceSelect('update')
                    } else {
                        if (!kanjoukamokuSelect.hasClass('init-on')) {
                            kanjoukamokuSelect.addClass('init-on')
                            kanjoukamokuSelect.val(kanjoukamokuSelect.find("option:first").val()).change()
                        }
                    }
                    // console.log(data);
                })
            }
        })
    }

    function initSelectGenba(allSelect) {
        // console.log({
        //     event: 'genbaInit'
        // })
        allSelect.each(function () {
            let genbaSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/genba", function (data) {
                    data = sortit(data, '工事名kana')
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.工事名) {
                            genbaSelect.append('<option value="' + element.工事名 +'" data-id="' + element._id+'">' + element.工事名+' </option>')
                        }
                    }
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
                            genbaSelect.val(genbaSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initSelectZeiritu(allSelect) {
        // console.log({
        //     event: 'zeirituInit'
        // })
        allSelect.each(function () {
            let zeirituSelect = $(this)
            if (!$(this).hasClass('init-on')) {
                $.get("/api/zeiritu", function (data) {
                    for (let index = 0; index < data.length; index++) {
                        let element = data[index]
                        if (element.el) {
                            if (!element.rate)
                                element.rate = 0
                            zeirituSelect.append('<option value="' +  element.rate + '" data-id="' + element._id + '">' + element.el+' </option>')
                        }
                    }
                    if (!zeirituSelect.hasClass('globalselector')) {
                        zeirituSelect.val('')
                        if (!zeirituSelect.attr('value')) {
                            zeirituSelect.val('')
                        } else {
                            zeirituSelect.val(zeirituSelect.attr('value'))
                        }
                        zeirituSelect.niceSelect('update')
                    } else {
                        if (!zeirituSelect.hasClass('init-on')) {
                            zeirituSelect.addClass('init-on')
                            zeirituSelect.val(zeirituSelect.find("option:first").val()).change()
                        }
                    }
                })
            }
        })
    }

    function initKanjoukamokuFilter() {
        var filterPanel = $('#filter-panel')
        if (!filterPanel.hasClass('init-on')) {
            $.get("/api/kanjoukamoku", function (data) {
                console.log(data)
                var inData = data.in
                var outData = data.out
                var mergedData = {}

                var allHtml = '<label class="btn sub-filter nav-link-inoutcome-sub-filter active"><input class="toggle" type="radio" value="" checked="true">すべて</label>'
                var inHtml = '<label class="btn sub-filter nav-link-inoutcome-sub-filter active"><input class="toggle" type="radio" value="" checked="true">すべて</label>'
                var outHtml = '<label class="btn sub-filter nav-link-inoutcome-sub-filter active"><input class="toggle" type="radio" value="" checked="true">すべて</label>'

                if (inData) {
                    for (var i = 0; i < inData.length; i++) {
                        var id = inData[i]._id
                        var el = inData[i].el
                        if (el) {
                            mergedData[el] = el
                            inHtml += '<label class="btn sub-filter nav-link-inoutcome-sub-filter"><input class="toggle" type="radio" value="' + el + '">' + el + '</label>'
                        }
                    }
                }
                if (outData) {
                    for (var i = 0; i < outData.length; i++) {
                        var id = outData[i]._id
                        var el = outData[i].el
                        if (el) {
                            mergedData[el] = el
                            outHtml += '<label class="btn sub-filter nav-link-inoutcome-sub-filter"><input class="toggle" type="radio" value="' + el + '">' + el + '</label>'
                        }
                    }
                }
                let keys = Object.keys(mergedData)
                keys.forEach(item => {
                    allHtml += '<label class="btn sub-filter nav-link-inoutcome-sub-filter"><input class="toggle" type="radio" value="' + item + '">' + item + '</label>'
                })

                console.log(mergedData);
                $('#filter-all-group').html(allHtml)
                $('#filter-in-group').html(inHtml)
                $('#filter-out-group').html(outHtml)
            })
            filterPanel.addClass('init-on')
        }
    }

    function initLabelSubTotalPrice(allSelect) {
        // console.log({
        //     event: 'subtotalInit'
        // })
        allSelect.each(function () {
            $(this).text(currencyFormat(0))
        })
    }

    function initLabelTotalPrice(allSelect) {
        // console.log({
        //     event: 'totalInit'
        // })
        allSelect.each(function () {
            $(this).text(numberFormat(0) + ' 円')
        })
    }

    function initDate(allSelect) {
        // console.log({
        //     event: 'dateInit'
        // })
        allSelect.each(function () {
            let dateSelect = $(this)
            let today = formatedDateString(new Date())

            let name = $(this).attr('name')
            if (name != 'from' && name != 'to') {
                dateSelect.val(todayJP)
                dateSelect.attr('data-date', today)
                dateSelect.addClass('isweekend-' + todayJP.substring(todayJP.indexOf('(')).replace('(', '').replace(')', ''))
            }

            dateSelect.datepicker({
                language: "ja",
                format: 'yyyy年mm月dd日(D)',
                autoclose: true,
                // startDate: null,
                endDate: new Date(),
                orientation: "bottom left"
            }).on('changeDate', function (e) {
                let dd = new Date(e.date)
                let ct = formatedDateString(dd)
                let options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                }
                const dJP = dd.toLocaleDateString('ja-JP', options)
                dateSelect.val(dJP)
                isweekendClass(dateSelect)
                dateSelect.addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
                dateSelect.attr('data-date', ct)
            })
        })
    }

    function initTable() {
        $('#batch-check').prop('checked', false)
        currQuery = Object.assign({}, initQuery)
        currRows = 0
        request2GetFilteredData(currQuery)
    }

    function initInputMask() {
        $('[data-toggle="input-mask"]').each(function(a, e) {
            var t = $(e).data("maskFormat"), n = $(e).data("reverse");
            null != n ? $(e).mask(t, {
                reverse: n
            }) : $(e).mask(t)
        })
    }

    function initForm() {

        //
        // Save Form
        //

        //ADDING GROUP
        $('body').on('click', '.addGroup', function (e) {
            addElement($(this).attr('data-name'))
        })

        //ADDING MINUS GROUP
        $('body').on('click', '.addGroupMinus', function (e) {
            addElement($(this).attr('data-name'), true)
        })

        //REMOVE GROUP FIELD
        $('body').on('click', '.removeGroup', function () {
            removeElement($(this).attr('data-name'), this)
        })
        
        // Input Sattei Price
        $('body').on('keyup', '.input-sateiprice', function () {
            let element = $(this).parent().parent()
            updateSubTotal($(this), element.find('.input-zeiritu'), element.find('.input-tax'), element.find('.label-subtotal'), element.parent())
        })

        $('body').on('keyup', '.input-tax', function () {
            let element = $(this).parent().parent()
            var zeirituSelect = element.find('.input-zeiritu')
            zeirituSelect.val('')
            zeirituSelect.niceSelect('update')
            updateSubTotal(element.find('.input-sateiprice'), element.find('.input-zeiritu'), $(this), element.find('.label-subtotal'), element.parent())
        })

        // Selector Zeirutu
        $('body').on('change', 'select.input-zeiritu', function () {
            let element = $(this).parent().parent()
            element.find('.input-tax').val('')
            updateSubTotal(element.find('.input-sateiprice'), $(this), element.find('.input-tax'), element.find('.label-subtotal'), element.parent())
        })

        // Save Form
        $('body').on('click', '.saveBtn', function() {
            let formSelect = $(this).attr('data-name')
            saveToDB(formSelect, function (msg) {

                // error
                if (msg) {
                    console.log(msg.message)
                    return
                }

                // success

                // initialize elements
                let firstElement

                let formID = '.form-container.' + formSelect
                onFileItemRemove($('.act-remove'))
                let elements = $('body').find(formID + ' .elements')
                $.each(elements.children(), function() {
                    let element = $(this)
                    if (element.hasClass('element')) {
                        if (element.attr('data-value') > 1) {   // remove all elements excepting the first one
                            element.remove()
                        } else {                                // initialize the values for the first element
                            firstElement = element
                            let selectKanjoukamoku = element.find('.input-kanjoukamoku')
                            let selectGenba = element.find('.input-genba-daityou')
                            let inputBikou = element.find('.input-bikou')
                            let inputSateiprice = element.find('.input-sateiprice')
                            let inputTax = element.find('.input-tax')
                            let selectZeiritu = element.find('.input-zeiritu')

                            selectKanjoukamoku.val('')
                            selectKanjoukamoku.niceSelect('update')
                            selectGenba.val('')
                            selectGenba.niceSelect('update')
                            inputBikou.val('')
                            inputSateiprice.val('')
                            inputTax.val('')
                            selectZeiritu.val('')
                            selectZeiritu.niceSelect('update')

                            // initialize the global controls
                            var selectKouza = $('#input-kouza')
                            var selectHattyu = $('#input-hattyu')
                            selectKouza.val('')
                            selectKouza.niceSelect('update')
                            selectHattyu.val('')
                            selectHattyu.niceSelect('update')
                        }
                    }
                })

                updateSubTotal(firstElement.find('.input-sateiprice'), firstElement.find('.input-zeiritu'), firstElement.find('.input-tax'), firstElement.find('.label-subtotal'), firstElement.parent())

                // update table with new elements
                initTable()
            })
        })
    
    
        //
        // Filter Form
        //

        // Main Tab
        $('body').on('click', '.nav-link-inoutcome-filter', function() {

            // update torihiki selector according to the main tab
            let tab = $(this).attr('data-name')
            let hattyu = $('#input-filter-hattyu') // in
            let hattyuNice = $('#input-filter-hattyu + div') // in
            let gyousha = $('#input-filter-gyousha') // out
            let gyoushaNice = $('#input-filter-gyousha + div') // out
            let torihiki = $('#input-filter-torihiki') // all
            let torihikiNice = $('#input-filter-torihiki + div') // all

            if (tab == 'all') {
                hattyu.addClass('d-none')
                hattyuNice.addClass('d-none')
                gyousha.addClass('d-none')
                gyoushaNice.addClass('d-none')
                torihiki.removeClass('d-none')
                torihikiNice.removeClass('d-none')
            } else if (tab == 'in') {
                hattyu.removeClass('d-none')
                hattyuNice.removeClass('d-none')
                gyousha.addClass('d-none')
                gyoushaNice.addClass('d-none')
                torihiki.addClass('d-none')
                torihikiNice.addClass('d-none')
            } else if (tab == 'out') {
                hattyu.addClass('d-none')
                hattyuNice.addClass('d-none')
                gyousha.removeClass('d-none')
                gyoushaNice.removeClass('d-none')
                torihiki.addClass('d-none')
                torihikiNice.addClass('d-none')
            }
        })

        // Filter Button
        $('body').on('click', '#filterBtn', function () {

            let inoutType
            let kanjoukamoku
            currQuery = Object.assign({}, initQuery)

            // Main Tab(type)
            if ($('#filter-income-tab').hasClass('active') == true) { // in
                inoutType = '収入'
            } else if ($('#filter-outcome-tab').hasClass('active') == true) { // out
                inoutType = '支出'
            }

            if (inoutType) { // type = all
                currQuery.inoutType = inoutType
            }

            // Sub Tab(kanjoukamoku)
            let subTabPanel
            if (inoutType == '収入') { // in
                subTabPanel = $('#filter-income')
            } else if (inoutType == '支出') { // out
                subTabPanel = $('#filter-outcome')
            } else { // all
                subTabPanel = $('#filter-all')
            }

            let subTabs = subTabPanel.find('.btn-group-toggle .btn-group')
            $.each(subTabs.find('label'), function() {
                if ($(this).hasClass('active')) {
                    let value = $(this).find('input').val()
                    if (value)
                        kanjoukamoku = value
                }
            })

            if (kanjoukamoku) { // kanjoukamoku = all
                currQuery.勘定科目 = kanjoukamoku
            }

            // date from/to
            let dateFrom = $('#date-from').attr('data-date')
            let dateTo = $('#date-to').attr('data-date')
            dateFrom !== undefined && (currQuery.dateFrom = dateFrom)
            dateTo !== undefined && (currQuery.dateTo = dateTo)

            // kouza selector
            // let kouza = $('#input-filter-kouza').val()
            // if (kouza) {
            //     currQuery.口座 = kouza
            // }

            // torihiki selector
            let torihiki
            if (inoutType == '収入') { // in
                torihiki = $('#input-filter-hattyu').val()
            } else if (inoutType == '支出') { // out
                torihiki = $('#input-filter-gyousha').val()
            } else { // all
                torihiki = $('#input-filter-torihiki').val()
            }

            if (torihiki) {
                currQuery.取引先 = torihiki
            }

            // genba selector
            let genba = $('#input-filter-genba').val()
            if (genba) {
                currQuery.現場名 = genba
            }

            // bikou input
            let bikou = $('#input-filter-bikou').val()
            if (bikou) {
                currQuery.備考 = bikou
            }

            // satei price from/to
            let priceFrom = $('#input-filter-price-from').val()
            let priceTo = $('#input-filter-price-to').val()
            if (priceFrom) {
                currQuery.priceFrom = priceFrom
            }
            if (priceTo) {
                currQuery.priceTo = priceTo
            }

            if (prevQuery && JSON.stringify(prevQuery) == JSON.stringify(currQuery)) {
                // console.log("same query")
            } else {
                // console.log(currQuery)
                prevQuery = Object.assign({}, currQuery)
                currRows = 0

                request2GetFilteredData(currQuery)
            }

        })

        // Batch Delete
        $('body').on('click', '#filterAllBtn', function () {
            deleteCheckedList()
        })

        // Clear Filter Button
        $('body').on('click', '#clearFilterBtn', function () {
            clearFilterDate()
            // clearFilterKouza()
            clearFilterHattyu()
            clearFilterGenba()
            clearFilterCategory()
        })

        // CSV import
        $('body').on('change', '#importDialog', function () {
            $('#importForm').submit()
        })

        $('body').on('click', '.ic-feather-x', function () {
            var dataId = $(this).attr('data-id')
            if (dataId == 'input-filter-date') {
                clearFilterDate()
            // } else if (dataId == 'input-filter-kouza') {
            //     clearFilterKouza()
            } else if (dataId == 'input-filter-httyu') {
                clearFilterHattyu()
            } else if (dataId == 'input-filter-genba') {
                clearFilterGenba()
            }
        })

        $('#batch-check').click(function(){
            if($(this).is(':checked')){
                $('.item-check').prop('checked', true)
            }
            else {
                $('.item-check').prop('checked', false)
            }
        })

        $('body').on('click', '.item-check', function () {
            // console.log("item-check");
            // var checkbox = $(this).find('input')
            // if (checkbox.is(':checked')) {
            //     checkbox.prop('checked', false)
            // } else {
            //     checkbox.prop('checked', true)
            // }
        })

        // $('body').on('click', '.list-item', function () {
            // var checkbox = $(this).find('input')
            // if (checkbox.is(':checked')) {
            //     checkbox.prop('checked', false)
            // } else {
            //     checkbox.prop('checked', true)
            // }
            // console.log("list-item");
        // })

        $('body').on('keydown', '.input-date-filter', function (e) {
            if (e.keyCode == 8 || e.keyCode == 46) { // backspace | delete
                $(this).val('')
                $(this).attr('data-date', '')
            }
        })

        // Show More
        $('body').on('click', '#showMoreBtn', function (e) {
            let tbody = $('#inoutcome-filtered-tbody')
            let currOffset = currQuery.offset
            // currQuery = Object.assign({}, initQuery)
            currQuery.offset = currOffset + LIMIT
            request2GetFilteredData(currQuery, true)
        })

        // table edit mode
        $('body').on('click', '.td-date', function () {
            if ($(this).hasClass('in-edit-date')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-date')

            var currDate = $(this).html()
            $(this).html('<input class="border rounded py-2 w-100" type="text" name="item-date">')

            // const todayJP = date.toLocaleDateString('ja-JP', options)
            var date = new Date(currDate)
            var dateStr = date.toLocaleDateString('ja-JP', options)
            var dateSelect = $('.in-edit-date input')
            // dateSelect.val(dateStr)
            dateSelect.val(currDate)
            dateSelect.attr('data-date', currDate)
            dateSelect.addClass('isweekend-' + dateStr.substring(dateStr.indexOf('(')).replace('(', '').replace(')', ''))
            
            dateSelect.datepicker({
                language: "ja",
                format: 'yyyy/mm/dd',
                autoclose: true,
                // startDate: null,
                endDate: new Date(),
                orientation: "right"
            }).on('changeDate', function (e) {
                let dd = new Date(e.date)
                let ct = formatedDateString(dd)
                let options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                }
                const dJP = dd.toLocaleDateString('ja-JP', options)
                console.log(ct);
                dateSelect.val(ct)
                isweekendClass(dateSelect)
                dateSelect.addClass('isweekend-' + dJP.substring(dJP.indexOf('(')).replace('(', '').replace(')', ''))
                dateSelect.attr('data-date', ct)
                finishItemEdit()
            })
        })

        $('body').on('click', '.td-torihiki', function() {
            if ($(this).hasClass('in-edit-torihiki')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-torihiki')

            var currTorihiki = $(this).html()
            $(this).html('')

            var selector = '';
            if ($(this).hasClass('td-income'))
                selector = '.input-hattyu';
            else
                selector = '.input-gyousha';

            var inputTorihiki = $('select' + selector).first().clone()
            var selectTorihiki = $('div.nice-select' + selector).first().clone()
            inputTorihiki.attr('name', 'item-torihiki')
            inputTorihiki.val(currTorihiki)
            selectTorihiki.find('.current').html(currTorihiki)
            // selectTorihiki.css({
            //     'max-height': '27px',
            //     'font-size': '0.8rem',
            //     'line-height': '22px',
            //     'margin-left': '0.25rem'
            // })

            $(this).append(inputTorihiki)
            $(this).append(selectTorihiki)
        })

        $('body').on('click', '.td-kamoku', function() {
            if ($(this).hasClass('in-edit-kamoku')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-kamoku')

            var formID = '';
            if ($(this).hasClass('td-income'))
                formID = '.form-container.income';
            else
                formID = '.form-container.outcome';

            var currKamoku = $(this).html()
            $(this).html('')

            var inputKamoku = $(formID + ' select.input-kanjoukamoku').first().clone()
            var selectKamoku = $(formID + ' div.nice-select.input-kanjoukamoku').first().clone()
            inputKamoku.attr('name', 'item-kamoku')
            inputKamoku.val(currKamoku)
            selectKamoku.find('.current').html(currKamoku)
            // selectKamoku.css({
            //     'max-height': '27px',
            //     'font-size': '0.8rem',
            //     'line-height': '22px',
            //     'margin-left': '0.25rem'
            // })

            $(this).append(inputKamoku)
            $(this).append(selectKamoku)
            $(this).css('max-height', '27px')
        })

        $('body').on('click', '.td-genba', function() {
            if ($(this).hasClass('in-edit-genba')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-genba')

            var currGenba = $(this).html()
            $(this).html('')

            var inputGenba = $('select.input-genba-daityou').first().clone()
            var selectGenba = $('div.nice-select.input-genba-daityou').first().clone()
            inputGenba.attr('name', 'item-genba')
            inputGenba.val(currGenba)
            selectGenba.find('.current').html(currGenba)

            $(this).append(inputGenba)
            $(this).append(selectGenba)
        })

        $('body').on('click', '.td-bikou', function () {
            if ($(this).hasClass('in-edit-bikou')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-bikou')

            var currBikou = $(this).html()
            $(this).html('<input class="border-0 form-control text-right pr-1 m-1 w-100" style="font-size:0.8rem;max-height:27px" name="item-bikou" value="' + currBikou + '">')
            $('.in-edit-bikou input').focus()
        })

        $('body').on('click', '.td-price', function () {
            if ($(this).hasClass('in-edit-price')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-price')

            var currPrice = $(this).html()
            $(this).html('<input class="border-0 form-control text-right pr-1 m-1 w-100" style="font-size:0.8rem;max-height:27px" data-toggle="input-mask" data-mask-format="00,000,000,000,000" data-reverse="true" name="item-price" value="' + currPrice + '">')
            $('.in-edit-price input').focus()

            $('[data-toggle="input-mask"]').each(function(a, e) {
                var t = $(e).data("maskFormat"), n = $(e).data("reverse");
                null != n ? $(e).mask(t, {
                    reverse: n
                }) : $(e).mask(t)
            })
        })

        $('body').on('click', '.td-tax', function () {
            if ($(this).hasClass('in-edit-tax')) {
                return    
            }

            finishItemEdit()
            $(this).addClass('in-edit-tax')

            var currTax = $(this).html()
            $(this).html('<input class="border-0 form-control text-right pr-1 m-1 w-100" style="font-size:0.8rem;max-height:27px" data-toggle="input-mask" data-mask-format="00,000,000,000,000" data-reverse="true" name="item-tax" value="' + currTax + '">')
            $('.in-edit-tax input').focus()

            $('[data-toggle="input-mask"]').each(function(a, e) {
                var t = $(e).data("maskFormat"), n = $(e).data("reverse");
                null != n ? $(e).mask(t, {
                    reverse: n
                }) : $(e).mask(t)
            })
        })

        $('body').on('blur', '.in-edit-price, .in-edit-tax, .in-edit-bikou', function () {
            finishItemEdit()
        })

        $('body').on({
            mouseenter: function () {
                $(this).find('.settingOptions1').css('display','inline-block')
            },
            mouseleave: function () {
                $(this).find('.settingOptions1').css('display','none')
            }
        }, '.form-row')

        $('body').on('click', '#attachment', function () {
            $('#upload').trigger("click")
        })

        $('input:file').on('change', function (e) {
            updateFile($(this), e.target)
        })

        setItemEditFinishEvent()
    }

    function onFileItemRemove(thiz) {
        if (thiz != undefined) {
            var fileItem = thiz.parent().parent()
            fileItem.find('.filename').remove()
            fileItem.find('input:file').val('')
        }
    }

    function setItemEditFinishEvent() {
        $('body').on('change', 'select[name="item-torihiki"],select[name="item-kamoku"],select[name="item-genba"]', function () {
            finishItemEdit()
        })
        $('body').on('keyup', 'input[name="item-price"],input[name="item-tax"],input[name="item-bikou"]', function (e) {
            if (e.which == 13)
                finishItemEdit()
            else {
                var tr = $(this).parent().parent()
                var tdRealPrice = tr.find('.td-real-price')
                var tax = 0, price = 0

                if ($(this).attr('name') == 'item-price') {
                    var tdTax = tr.find('.td-tax')
                    var tax = parseInt(stringFormatedNumber(tdTax.html()))
                    var price = parseInt(stringFormatedNumber($(this).val()))
                } else if ($(this).attr('name') == 'item-tax') {
                    var tdPrice = tr.find('.td-price')
                    var price = parseInt(stringFormatedNumber(tdPrice.html()))
                    var tax = parseInt(stringFormatedNumber($(this).val()))
                } else {
                    return
                }
                var realPrice = price + tax
                tdRealPrice.html(numberFormat(realPrice))
            }
        })
        $('body').keyup(function (e) {
            if (e.keyCode == 27)
                finishItemEdit()
        })
    }

    function finishItemEdit() {
        var _id = null
        var date = null
        var torihiki = null
        var torihikiID = null
        var kamoku = null
        var genba = null
        var genbaID = null
        var bikou = null
        var price = null
        var tax = null

        var editDate = $('.in-edit-date')
        if (editDate.length > 0) {
            var val = editDate.find('input').val()
            editDate.removeClass('in-edit-date')
            editDate.html(val)
            date = val
            _id = editDate.parent().attr('data-id')
        }

        var editTorihiki = $('.in-edit-torihiki')
        if (editTorihiki.length > 0) {
            var select = editTorihiki.find('select')
            var val = select.val()
            torihikiID = select.find('option:checked').attr('data-id')
            editTorihiki.remove('select')
            editTorihiki.remove('div')
            editTorihiki.removeClass('in-edit-torihiki')
            editTorihiki.html(val)
            torihiki = val
            _id = editTorihiki.parent().attr('data-id')
        }

        var editKamoku = $('.in-edit-kamoku')
        if (editKamoku.length > 0) {
            var val = editKamoku.find('select').val()
            editKamoku.remove('select')
            editKamoku.remove('div')
            editKamoku.removeClass('in-edit-kamoku')
            editKamoku.html(val)
            kamoku = val
            _id = editKamoku.parent().attr('data-id')
        }

        var editGenba = $('.in-edit-genba')
        if (editGenba.length > 0) {
            var select = editGenba.find('select')
            var val = select.val()
            genbaID = select.find('option:checked').attr('data-id')
            editGenba.remove('div')
            editGenba.removeClass('in-edit-genba')
            editGenba.html(val)
            genba = val
            _id = editGenba.parent().attr('data-id')
        }

        var editBikou = $('.in-edit-bikou')
        if (editBikou.length > 0) {
            bikou = editBikou.find('input').val()
            editBikou.removeClass('in-edit-bikou')
            editBikou.html(bikou)
            _id = editBikou.parent().attr('data-id')
        }

        var editPrice = $('.in-edit-price')
        if (editPrice.length > 0) {
            var val = stringFormatedNumber(editPrice.find('input').val())
            editPrice.removeClass('in-edit-price')
            if (isNaN(val)) {
                editPrice.html(0)
                val = 0
            } else {
                editPrice.html(numberFormat(val))
            }
            price = val
            _id = editPrice.parent().attr('data-id')
        }

        var editTax = $('.in-edit-tax')
        if (editTax.length > 0) {
            var val = stringFormatedNumber(editTax.find('input').val())
            editTax.removeClass('in-edit-tax')
            if (isNaN(val)) {
                editTax.html(0)
                val = 0
            } else {
                editTax.html(numberFormat(val))
            }
            tax = val
            _id = editTax.parent().attr('data-id')
        }

        var query = {}
        if (_id) {
            query['_id'] = _id
            if (torihiki) {
                query['取引先'] = torihiki
                query['torihiki_id'] = torihikiID
            }
            if (kamoku)
                query['勘定科目'] = kamoku
            if (genba) {
                query['現場名'] = genba
                query['genba_id'] = genbaID
            }
            if (bikou)
                query['備考'] = bikou
            if (price)
                query['査定金額'] = price
            if (tax)
                query['消費税'] = tax
            if (date)
                query['日付'] = date

            if (Object.keys(query).length > 0) {
                console.log(query)
                $('#saving-progress').fadeIn(500)
                $.post('/api/update/inoutcome/element/', query, function (data) {
                    console.log(data)
                    setTimeout(() => {
                        $('#saving-progress').fadeOut(500)
                    }, 1000);
                })
            }
        }
    }

    function clearFilterDate() {
        $('#date-from').val('')
        $('#date-from').attr('data-date', '')
        $('#date-to').val('')
        $('#date-to').attr('data-date', '')
    }

    function clearFilterKouza() {
        $('#input-filter-kouza').val('')
        $('#input-filter-kouza').niceSelect('update')
    }

    function clearFilterHattyu() {
        $('#input-filter-hattyu').val('')
        $('#input-filter-gyousha').val('')
        $('#input-filter-torihiki').val('')
        $('#input-filter-hattyu').niceSelect('update')
        $('#input-filter-gyousha').niceSelect('update')
        $('#input-filter-torihiki').niceSelect('update')
    }

    function clearFilterGenba() {
        $('#input-filter-genba').val('')
        $('#input-filter-genba').niceSelect('update')
    }

    function clearFilterCategory() {
        $('.btn-group .active').removeClass('active')
        $('label.sub-filter:first-child').addClass('active')
        $('#filter-all-tab').attr('aria-selected', true)
        $('#filter-income-tab').attr('aria-selected', false)
        $('#filter-outcome-tab').attr('aria-selected', false)
        $('#filter-all-tab').addClass('active')
        $('#filter-income-tab').removeClass('active')
        $('#filter-outcome-tab').removeClass('active')
    }

    function updateSubTotal(inputSateiprice, selectZeiritu, inputTax, labelSubTotal, elements) {
        /////
        // calculate price with tax (tax-rate: zeiritu, raw-price: sateiprice)
        let taxRate = parseInt(selectZeiritu.val())
        let tax = parseInt(stringFormatedNumber(inputTax.val()))
        let price = parseInt(stringFormatedNumber(inputSateiprice.val()))
        if (isNaN(price))
            price = 0

        let priceWithTax = 0
        if (price > 0) {
            if (!isNaN(taxRate))
                priceWithTax = price + price * taxRate / 100
            else if (!isNaN(tax))
                priceWithTax = price + tax
            else
                priceWithTax = 0
        }

        // update sub total price label
        labelSubTotal.attr('data-value', priceWithTax) // for calculating total sum
        labelSubTotal.text(currencyFormat(priceWithTax)) // show price as text
        /////

        // update total price label
        updateTotalPrice(elements)
    }

    function updateTotalPrice(elements) {

        let formContainer = elements.parent()

        // sum of the elements subtotals
        let totalPriceLabel = formContainer.find('.label-totalprice')

        let totalPrice = 0
        $.each(elements.children(), function () {
            let element = $(this)
            if (element.hasClass('element')) {
                let subTotalLabel = element.find('.label-subtotal')
                let price = parseInt(subTotalLabel.attr('data-value'))
                var isMinus = element.attr('minus') == '1' ? true : false
                if (!isNaN(price)) {
                    if (isMinus)
                        totalPrice -= price
                    else
                        totalPrice += price
                }
            }
        })

        // show price as text
        totalPriceLabel.text(numberFormat(totalPrice) + ' 円')
    }

    function addElement(formSelect, isMinus) {
        let formID = '.form-container.' + formSelect
        let group = $(formID + ' .form-group .form-row.element').last().clone()
        let currVal = parseInt(group.attr('data-value')) + 1
        if (currVal > 20) {
            alert('Maximum entry is 20')
        } else {
            group.attr('data-value', currVal)
            group.attr('minus', isMinus ? '1' : '0')
            // let gIc = parseInt($(formID + ' .form-group .form-row.element').length + 1)
            // $('.totalLine.' + formSelect).attr('value', gIc)
            group.find('.removeGroup').attr('data-value', currVal)
            // group.find('label').remove()
            $(formID + ' .form-group.elements').append(group).fadeIn(500)
            $.each(group.find('input'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).val('').change()
                    $(this).attr('value', '')
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
            $.each(group.find('.label-subtotal'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    $(this).attr('data-value', 0)
                    $(this).text(currencyFormat(0))
                }
            })
            $.each(group.find('.span-minus'), function () {
                if($(this).attr('name')) {
                    let name = $(this).attr('name').substring(0, $(this).attr('name').indexOf('-') + 1)
                    $(this).attr('name', name + currVal)
                    if (isMinus) {
                        $(this).addClass('bg-danger')
                    } else {
                        $(this).removeClass('bg-danger')
                    }
                }
            })

            group.find('[data-toggle="input-mask"]').each(function(a, e) {
                var t = $(e).data("maskFormat"), n = $(e).data("reverse");
                null != n ? $(e).mask(t, {
                    reverse: n
                }) : $(e).mask(t)
            })
        }
    }

    function removeElement(formSelect, self) {
        let formID = '.form-container.' + formSelect
        if ($('body').find(formID + ' .form-group .form-row.element').length > 1) {
            $(formID + ' .form-group .form-row.element[data-value="' + $(self).attr('data-value') + '"]').fadeOut(500, function () {
                $(this).remove()

                // update total price label after removing
                let elements = $('body').find(formID + ' .elements')
                updateTotalPrice(elements)
            })
            // let gIc = parseInt($(formID + ' .form-group .form-row.element').length - 1)
            // $('.totalLine.' + formSelect).attr('value', gIc)

            setTimeout(() => {
                updateElementIndex(formID)
            }, 2000)
        }
    }

    function updateElementIndex(formID) {
        $(formID).find('.form-group.element').each(function (index, value) {
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
        })
    }

    function updateTableOnResponse(data, append = false) {
        let tbody = $('#inoutcome-filtered-tbody')
        var html = ''
        data.forEach(function(item) {
            var id = item._id;
            var genbaID = item.genba_id;
            var torihikiID = item.torihiki_id;
            var type = item.type
            var kanjoukamoku = item.勘定科目
            var date = item.日付
            // var kouza = item.口座
            var torihiki = item.取引先
            var genba = item.現場名
            var bikou = item.備考
            var price = item.査定金額
            var zeiritu = item.税率
            var file = item.file
            var tax;
            if (zeiritu != undefined)
                tax = parseInt((price * zeiritu / 100).toFixed())
            else
                tax = item.消費税
            var priceWithTax = price + tax
            if (!tax) tax = 0
            if (!priceWithTax) priceWithTax = 0

            html += '<tr class="list-item" data-id="' + id + '" data-genba-id="' + genbaID + '" data-torihiki-id="' + torihikiID + '"><td class="text-left"><label class="mb-0 pl-2 py-2 d-flex" style="color:' + (type == '収入' ? '#00b0f0' : '#ea4335') + ';cursor:pointer"><input type="checkbox" style="cursor:pointer;margin-top:3px" class="item-check" data-value="' + item._id + '"><span class="pl-2">' + type + '</span></label>' +
                    '</td><td class="pr-1 td-date">' + date + '</td><td class="pr-1 td-torihiki ' + (type == '収入' ? 'td-income' : 'td-outcome') + '">' + torihiki +
                    '</td><td class="pr-1 td-kamoku ' + (type == '収入' ? 'td-income' : 'td-outcome') + '">' + kanjoukamoku + '</td><td class="pr-1 td-genba">' + genba +
                    '</td><td class="pr-1 td-bikou">' + bikou + '</td><td class="pr-1 td-price">' + numberFormat(price) +
                    '</td><td class="pr-1 td-tax">' + numberFormat(tax) + '</td><td class="pr-1 td-real-price">' + numberFormat(priceWithTax) +
                    '</td><td class="td-file text-center" data-file="' + file + '">' + 
                    (file === undefined ? '' : '<span class="pb-1" style="height: 20px;color:gray;" data-feather="paperclip"></span>') + 
                    '</td></tr>'
        })
        if (append) {
            tbody.append(html)
        } else {
            tbody.html(html)
        }

        $('.td-file').on('click', function() {
            var file = $(this).attr('data-file')
            let win = window.open(`/api/download/${file}`)
        })
    }

    function request2GetFilteredData(query, append = false) {
        $('#searching-progress').fadeIn(500)
        $.post('/api/inoutcome/', query, function (data) {
            console.log(data)
            updateTableOnResponse(data, append)
            setTimeout(() => {
                $('#searching-progress').fadeOut(500)
            }, 1000);
        })
    }

    function updateFile(thiz, file) {
        if (file.files.length > 0) {
            $('.filename').remove()
            var fileItem = thiz.parent()
            var fileName = file.files[0].name
            var appendix = '<div class="filename d-inline-block mt-2 ml-2" style="cursor:pointer">' + fileName +
            '<a href="javascript:void(0)" class="remove act-remove" tabindex="-1" title="Remove">×</a></div>'
            fileItem.append(appendix)

            $('.act-remove').on('click', function () {
                onFileItemRemove($(this))
            })
        }
    }

    function saveToDB(formSelect, callback) {
        let formId = '.form-container.' + formSelect

        // let selectKouza = $(formId).find('.input-kouza')
        let selectTorihiki = formSelect == 'income' ? $(formId).find('.input-hattyu') : $(formId).find('.input-gyousha')
        let torihikiID = selectTorihiki.find('option:checked').attr('data-id')
        let selectDate = $(formId).find('.input-date-inoutcome')

        // let kouza = selectKouza.val()
        let torihiki = selectTorihiki.val()
        let date = selectDate.attr('data-date')

        let formData = new FormData()

        // if (kouza && torihiki && date) {
        if (torihiki && date) {
            // formData.口座 = kouza
            formData.append('torihiki_id', torihikiID)
            formData.append('取引先', torihiki)
            formData.append('日付', date)
        } else {
            if (callback) {
                callback({message:"empty setting"})
            }
            return
        }

        let type = formSelect == 'income' ? '収入' : '支出'
        let elements = $(formId).find('.elements')
        let items = []

        $.each(elements.children(), function () {
            let element = $(this)
            if (element.hasClass('element')) {
                let selectKanjoukamoku = element.find('.input-kanjoukamoku')
                let selectGenba = element.find('.input-genba-daityou')
                let inputBikou = element.find('.input-bikou')
                let inputSateiprice = element.find('.input-sateiprice')
                let inputTax = element.find('.input-tax')
                let selectZeiritu = element.find('.input-zeiritu')
                var isMinus = element.attr('minus') == '1' ? true : false

                let kanjoukamoku = selectKanjoukamoku.val()
                let genba = selectGenba.val()
                let genbaID = selectGenba.find('option:checked').attr('data-id')
                let bikou = inputBikou.val()
                let sateiprice = parseInt(stringFormatedNumber(inputSateiprice.val()))
                let tax = parseInt(stringFormatedNumber(inputTax.val()))
                let zeiritu = selectZeiritu.val()

                if (kanjoukamoku && genba && (zeiritu || (!isNaN(tax) && tax > 0)) && !isNaN(sateiprice)) {
                    let data = {
                        type: type,
                        勘定科目: kanjoukamoku,
                        genba_id: genbaID,
                        現場名: genba,
                        備考: bikou,
                        査定金額: isMinus ? -sateiprice : sateiprice,
                    }
                    if (!isNaN(tax) && tax > 0)
                        data.消費税 = tax
                    else
                        data.税率 = zeiritu
                    items.push(data)
                }
            }
        })

        if (items.length == 0) {
            if (callback) {
                callback({message:"empty data"})
            }
            return
        }

        formData.append('data', JSON.stringify(items))
        formData.append('files', $('input[type=file]')[0].files[0])

        // console.log(result)
        $('#saving-progress').fadeIn(500)
        // $.post('/api/update/inoutcome/', result, function (data) {
        //     // console.log(data)
        //     setTimeout(() => {
        //         $('#saving-progress').fadeOut(500)
        //         if (callback) { callback() }
        //     }, 1000);
        // })
        $.ajax({
            url: '/api/update/inoutcome/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                setTimeout(() => {
                    $('#saving-progress').fadeOut(500)
                    if (callback) { callback() }
                }, 1000);
            },
            error: function (error) {
                // Handle errors
                console.log("ajax", error);
            }
        });
    }

    function deleteCheckedList() {
        var ids = []
        $.each($(".item-check:checked"), function () {
            var _id = $(this).attr('data-value')
            ids.push(_id)
        })

        if (ids.length > 0) {
            var query = {ids: ids}
            $.post('/api/delete/inoutcome/', query, function (data) {
                // console.log(data)
                initTable()
            })
        }
    }
})

function currencyFormat(number) {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(number)
}

function numberFormat(number) {
    return new Intl.NumberFormat('ja-JP').format(number)
}

function paddingNumber(number, padding) {
    var num = "" + number
    while(num.length < padding) num = "0" + num
    return num
}

function formatedDateString(date) {
    return date.getFullYear() + '/' + paddingNumber(date.getMonth() + 1, 2) + '/' + paddingNumber(date.getDate(), 2)   
}

function stringFormatedNumber(numberStr) {
    if (numberStr) {
        return numberStr.replace(/,/g, '')
    }
    return '0'
}