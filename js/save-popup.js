$(document).ready(() => {
  const showSavePasswordDom = (obj) => {
    console.log('showing this div, ', obj);
    $('#save-credentials-domain').val(obj.domain);
    $('#save-credentials-login').val(obj.login);
    $('#save-credentials-password').val(obj.password);
    $('#save-credentials').removeClass('hidden');
  };

  $('#save-credentials-submit').click(function (e) {
    // take those values and save to blockchain
    const obj = {
      domain: $('#save-credentials-domain').val(),
      login: $('#save-credentials-login').val(),
      password: $('#save-credentials-password').val()
    };

    // tell the background to clear the tempCredentials
    chrome.runtime.sendMessage({type: "clearTemp", credentials: obj}, function (response) {
      $('#save-credentials').hide();
    });
  });

  $('#dismiss-save').click(function (e) {
    $('#save-credentials').hide();
    chrome.runtime.sendMessage({
      type: "clearTempCredentials",
    });
  });

  chrome.runtime.sendMessage({
    type: "requestInfo",
  }, function (info) {
    showSavePasswordDom(info.tempCredentials);
  });
})
