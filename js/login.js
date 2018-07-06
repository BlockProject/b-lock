$(document).ready(() => {
  let info;

  $("#unlock-keystore").click(function() {
    chrome.runtime.sendMessage({
      type: "unlockAccount",
      password: $("#unlock-keystore-password").val()
    }, function (response) {
      info = response;
      refresh();
    });
  });

  const refresh = () => {
    // console.log('got this info : ', info);

    if (info == undefined) return;
    if (!info.unlockAccount.unlocked) { // user created account, haven't logged in
      // console.log('info.account.address = ', info.account.address);
      if (info.unlockAccount.wrongPass) {
        $("#login-div-main-wrong-password").show();
      } else {
        $("#login-div-main-wrong-password").hide();
      }
    } else { // user already logged in
      window.close()
    }
  }

  chrome.runtime.sendMessage({
    type: "requestInfo",
  }, function (response) {
    info = response;
    refresh();
  });
})
