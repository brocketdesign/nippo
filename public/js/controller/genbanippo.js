$(document).ready(async function () {

    if (!!document.querySelector('.ichiranPage')) {
        initCopyButtons()
        SUA({ event: '現場日報一覧ページ' })
    }

    function initCopyButtons() {
        $('body').on('click', '.btn-nippo-copy', function() {
            let element = $(this).parent().parent().parent()
            let id = element.attr('data-id') // [genbaID]_genbanippo/_id
            let date = element.attr('data-value')
            console.log({id:id, date:date})
        })
    }
})