$(document).ready(() => {
  let neb;
  let Account;
  // const Key = require("nebulas").Key;
  let account;
  let keystore;


  function setUpNeb() {
    var HttpRequest = require("nebulas").HttpRequest;
    var Neb = require("nebulas").Neb;
    Account = require("nebulas").Account;
    var Transaction = require("nebulas").Transaction;
    var Unit = require("nebulas").Unit;
    neb = new Neb();
    neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));

    chrome.storage.sync.get('keystore', function(data) {
      keystore = data.keystore;
      console.log(keystore);
      if (keystore == undefined) {
        $("#newAccount").show();
      }
    });
  }

  setUpNeb();

  function createExampleAccount() {
    account = Account.NewAccount();
    $('#private').html(account.getPrivateKeyString());
    $('#public').html(account.getPublicKeyString());
    chrome.storage.sync.set({keystore: account.toKeyString($("#newPassword").val())}, function() {
      console.log("\tJust set new keystore");
    });
    refreshAccountInfo();
  }

  function refreshAccountInfo() {
    neb.api.getAccountState(account.getAddressString()).then(function (state) {
      state = state.result || state;
      $('#address').html(account.getAddressString());
      $('#accountBalance').html(state.balance);
      $('#accountNonce').html(state.nonce);
    }).catch(function (err) {
        console.log("err:",err);
    });
  }

  $("#createAccountBtn").click(function () {
    createExampleAccount();
  });

  $("#unlockAccount").click(function() {
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

  chrome.runtime.sendMessage({type: "someTopic", options: {key: "value"}});
})
