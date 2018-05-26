$(document).ready(() => {
  let info;





  $("#createAccountBtn").click(function () {
    chrome.runtime.sendMessage({
      type: "createAccount",
      password: $("#newPassword").val(),
    });
  });

  $("#unlockAccount").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#password").val()
    });
    account = new Account();
    try {
      account.fromKey(keystore, $("#password").val());
      console.log(account);
      refreshAccountInfo();
      $("#unlockDiv").hide();
    } catch (err) {
      alert("wrong password!");
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == "info") {
      info = request.info;
      console.log('Got info: ', info);
      refresh();
    }
  });

  const refresh = () => {
    $(".section").hide();
    if (info == undefined) return;
    if (info.account.keystore == undefined) { // user haven't created account
      $("#newAccount").show();
    } else if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      console.log('info.account.address = ', info.account.address);
      $("#address").html(info.account.address);
      $("#unlockDiv").show();
      if (info.unlockAccount.wrongPass) {
        $("#wrongPass").show();
      } else {
        $("#wrongPass").hide();
      }
    } else { // user already logged in
      $("#address").html(info.account.address);
      $("#accountBalance").html(info.account.balance);
      $("#accountNonce").html(info.account.nonce);
    }
  }
  refresh();

  chrome.runtime.sendMessage({type: "requestInfo"});

})
