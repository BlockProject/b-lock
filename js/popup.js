$(document).ready(() => {
  let info;

  $("#createAccountBtn").click(function () {
    chrome.runtime.sendMessage({
      type: "createAccount",
      password: $("#newPassword").val(),
    }, function (response) {
      console.log('13');
      info = response;
      refresh();
    });
  });

  $("#unlockAccount").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#password").val()
    }, function (response) {
      console.log('24');
      console.log(response);
      info = response;
      refresh();
    });
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'moreInfo') {
      info = request.info;
      refresh();
    }
  });

  // chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //     if (request.type == 'saveCredentials') {
  //       showSavePasswordDom(request.credentials);
  //     }
  // });

  const showSavePasswordDom = (obj) => {
    console.log('showing this div, ', obj);
    $('#save-credentials-domain').val(obj.domain);
    $('#save-credentials-login').val(obj.login);
    $('#save-credentials-password').val(obj.password);
    $('#save-credentials').removeClass('hidden');
  };

  const refresh = () => {
    // $(".section").hide();
    $('#save-credentials').addClass('hidden');
    $('#saved-credentials').addClass('hidden');
    $('#newAccount').addClass('hidden');
    $('#unlockDiv').addClass('hidden');

    console.log('got this info : ', info);

    if (info.showSavePasswordDom) {
      showSavePasswordDom(info.tempCredentials);
    }

    if (info == undefined) return;
    if (info.account.keystore == undefined) { // user haven't created account
      $("#newAccount").removeClass('hidden');
    } else if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      // $('#newAccount').addClass('hidden');
      $("#address").html(info.account.address);
      $("#unlockDiv").removeClass('hidden');
      if (info.unlockAccount.wrongPass) {
        $("#wrongPass").show();
      } else {
        $("#wrongPass").hide();
      }
    } else { // user already logged in
      // $('#newAccount').addClass('hidden');
      // $('#unlockDiv').addClass('hidden');
      $("#address").html(info.account.address);
      $("#accountBalance").html(info.account.balance);
      $("#accountNonce").html(info.account.nonce);
      $("#saved-credentials").show();
      $("#plain-password-list").html(JSON.stringify(info.savedCredentials));
    }
  }
  // refresh();

  const requestRefreshFromBackground = function() {
    chrome.runtime.sendMessage({type: "requestInfo"}, function (response) {
      console.log('70');
      console.log(response);
      info = response;
      refresh();
    });
  }
  requestRefreshFromBackground();

  $("#refresh").click(function() {
    requestRefreshFromBackground();
  })

  $('#save-credentials-submit').click(function (e) {
    // take those values and save to blockchain
    const obj = {
      domain: $('#save-credentials-domain').val(),
      login: $('#save-credentials-login').val(),
      password: $('#save-credentials-password').val()
    };

    // chrome.runtime.sendMessage({type: "saveCredentials", credentials: obj});

    // tell the background to clear the tempCredentials
    chrome.runtime.sendMessage({type: "clearTemp", credentials: obj}, function (response) {
      info = response;
      refresh();
    });
  });
})
