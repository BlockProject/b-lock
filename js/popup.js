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
      info = response;
      refresh();
    });
  });

  $("#submit-nas-tx").click(function() {
    const destination = $("#nas-destination").val();
    const amount = $("#nas-amount").val();
    $('#nas-destination').val("");
    $('#nas-amount').val(0);

    chrome.runtime.sendMessage({
      type: "sendNas",
      destination,
      amount,
    });
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == 'infoForPopUp') {
      console.log('got infoForPopUp');
      info = request.info;
      refresh();
    }
  });

  const showSavePasswordDom = (obj) => {
    console.log('showing this div, ', obj);
    $('#save-credentials-domain').val(obj.domain);
    $('#save-credentials-login').val(obj.login);
    $('#save-credentials-password').val(obj.password);
  };

  const refresh = () => {
    // $(".section").hide();
    $('#saved-credentials').hide();
    $('#newAccount').hide();
    $('#unlockDiv').hide();
    $('#logged-in-view').hide();

    console.log('got this info : ', info);

    if (info == undefined) return;
    if (info.account.keystore == undefined) { // user haven't created account
      $("#newAccount").show();
    } else if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      // $('#newAccount').show();
      $("#address").html(info.account.address);
      $("#unlockDiv").show();
      if (info.unlockAccount.wrongPass) {
        $("#wrongPass").show();
      } else {
        $("#wrongPass").hide();
      }
    } else { // user already logged in
      $('#logged-in-view').show();

      $("#address").html(info.account.address);
      $("#accountBalance").html(info.account.balance);
      $("#accountNonce").html(info.account.nonce);
      $("#saved-credentials").show();
      $("#plain-password-list").html(JSON.stringify(info.savedCredentials));

      showSavePasswordDom(info.tempCredentials);
      for (transaction of info.pastTransactions) {
        console.log('transaction = ', transaction);
        const description = transaction.type === 'send' ? `Send ${transaction.amount} NAS` : `${transaction.url} | ${transaction.login}`;
        const status = ["Failed", "Done", "Pending"][transaction.status];
        const item = $("#" + transaction.txhash);
        if (item.length === 0) {
          const newElement = `<li id='${transaction.txhash}'>${description}\
            <a target="_blank" href="https://explorer.nebulas.io/#/${info.network}/tx/${transaction.txhash}">\
            ${status}</a>\
            </li>`;
          console.log('newElement = ', newElement);
          $("#transaction-history ul").append(newElement);
        } else {
          item.find('a').html(status);
        }
      }
    }
  }

  const requestRefreshFromBackground = function() {
    chrome.runtime.sendMessage({type: "requestInfo"}, (newInfo) => {
      console.log('newInfo', newInfo);
      info = newInfo;
      refresh();
    });
  }

  requestRefreshFromBackground();
  setInterval(requestRefreshFromBackground, 2000);

  $("#refresh").click(function() {
    requestRefreshFromBackground();
  })

  $('#save-credentials-submit').click(function (e) {
    const obj = {
      domain: $('#save-credentials-domain').val(),
      login: $('#save-credentials-login').val(),
      password: $('#save-credentials-password').val()
    };
    $('#save-credentials-domain').val("");
    $('#save-credentials-login').val("");
    $('#save-credentials-password').val("");
    chrome.runtime.sendMessage({type: "saveNewCrendentials", credentials: obj});
  });
})
