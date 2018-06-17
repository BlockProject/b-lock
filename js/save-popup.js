$(document).ready(() => {
  const showSavePasswordDom = (obj) => {
    // console.log('showing this div, ', obj);
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
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj}, function (response) {
      $('#save-credentials').hide();
    });
  });

  $('#toggle-visibility').click(function (e) {
    const container = $(e.target).closest('.save-credentials-container-item');
    if (container.attr('is-visible') == 'true') {
      $('#save-credentials-password').attr('type', 'password');
      $(e.target).html('visibility');
      container.attr('is-visible', 'false');
    } else {
      $('#save-credentials-password').attr('type', 'text');
      $(e.target).html('visibility_off');
      container.attr('is-visible', 'true');
    }
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
