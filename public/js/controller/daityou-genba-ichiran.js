$(document).ready(async function () {

  let genbaID = getUrlParameter('genbaID')
  let genbaName = getUrlParameter('genbaName')
  // let genbaID = "610c7d73c3640304088b6735"

  if (!!document.querySelector('#daityouGenbaIchiran')) {
    initNavBar()
  }

  function initNavBar() {
    $('#title').html(genbaName)
    var urlParams = 'genbaID=' + genbaID + '&genbaName=' + genbaName
    $('#nav-genba').attr('href', '/dashboard/daityou/genba?' + urlParams)
    $('#nav-sihara').attr('href', '/dashboard/daityou/sihara_ichiran?' + urlParams)
    // $('#nav-ichiran').attr('href', '/dashboard/daityou/genba_ichiran?' + urlParams)
    $('#nav-yosan').attr('href', '/dashboard/daityou/yosan?' + urlParams)
  }
})