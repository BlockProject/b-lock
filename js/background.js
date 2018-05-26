// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// import { HttpRequest, Neb, Transaction, Unit, Account } from 'nebulas.js';
const HttpRequest = require('nebulas').HttpRequest;
const Neb = require('nebulas').Neb;
const Transaction = require('nebulas').Transaction;
const Unit = require('nebulas').Unit;
const Account = require('nebulas').Account;

let neb;
let account = undefined;

// const Key = require("nebulas").Key;
let keystore;
let info = {
  account: {
    address: undefined,
    privKey: undefined,
    pubKey: undefined,
    nonce: undefined,
    keystore: undefined,
    balance: undefined,
  },
  unlockAccount: {
    unlocked: false,
    wrongPass: false,
  },
  showSavePasswordDom: false,
  tempCredentials: {},
  savedCredentials: []
};

// chrome.runtime.onInstalled.addListener(function() {
//   chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//     chrome.declarativeContent.onPageChanged.addRules([{
//       conditions: [new chrome.declarativeContent.PageStateMatcher({
//         // pageUrl: {hostEquals: 'developer.chrome.com'},
//       })
//       ],
//           actions: [new chrome.declarativeContent.ShowPageAction()]
//     }]);
//   });
// });

function setUpNeb() {
  neb = new Neb();
  neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));

  chrome.storage.sync.get('keystore', function(data) {
    info.account.keystore = data.keystore;
  });
}
setUpNeb();

// function refreshAccountInfo(callback) {
//   console.log('about to send info:', info);
//   // chrome.runtime.sendMessage({type: "info", info});
//
//   if (account == undefined) {
//     if (callback) {
//       callback(info);
//     }
//     return;
//   }
//   neb.api.getAccountState(account.getAddressString()).then(function (state) {
//     state = state.result || state;
//     info.account.address = account.getAddressString();
//     info.account.balance = state.balance;
//     info.account.nonce = state.nonce;
//     console.log('just updated account state, info: ', info);
//     // chrome.runtime.sendMessage({type: "info", info});
//     if (callback) {
//       callback(info);
//     }
//   }).catch(function (err) {
//       console.log("err:",err);
//   });
// }
// setInterval(refreshAccountInfo, 2000);

console.log("Yo");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'onTryLogin') {
    console.log(request.info);
    info.tempCredentials.domain = request.info.domain;
    info.tempCredentials.login = request.info.login;
    info.tempCredentials.password = request.info.password;
    info.showSavePasswordDom = true;
    chrome.browserAction.setBadgeText({
      text: '1'
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'fetchCredentials') {
    console.log('called by popup');
    sendResponse({
      domain: info.tempCredentials.domain,
      login: info.tempCredentials.login,
      password: info.tempCredentials.password
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'fetchIfSaved') {
    let autofill = false;
    let credentials = {};
    for (const savedCredential of info.savedCredentials) {
      if (savedCredential.domain == request.domain) {
        autofill = true;
        credentials = savedCredential;
        break;
      }
    }
    sendResponse({autofill: autofill, credentials: credentials});
  }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'requestInfo') {
    sendResponse(info);
    if (info.unlockAccount.unlocked) {
      neb.api.getAccountState(account.getAddressString()).then(function (state) {
        state = state.result || state;
        info.account.address = account.getAddressString();
        info.account.balance = state.balance;
        info.account.nonce = state.nonce;
        console.log('just updated account state, info: ', info);
        chrome.runtime.sendMessage({type: "moreInfo", info});
        // if (callback) {
        //   callback(info);
        // }
        // sendResponse(info);
      }).catch(function (err) {
          console.log("err:",err);
      });
    }
    // if (info.showSavePasswordDom) {
    //   chrome.browserAction.setBadgeText({text: ''});
    //   chrome.runtime.sendMessage({type: "saveCredentials", credentials: info.tempCredentials});
    // }
    // sendResponse(info);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'shouldActivate') {
    if (info.unlockAccount.unlocked) {
      sendResponse({activate: true});
    } else {
      sendResponse({activate: false});
    }
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'clearTemp') {
    info.showSavePasswordDom = false;
    info.tempCredentials = {};
    info.savedCredentials.push(request.credentials);
    chrome.browserAction.setBadgeText({text: ''});
  }
})

// // template for listening for messages from other scripts
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.type == "someTopic")  sendResponse();
// });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // if (request.type != "createAccount") return sendResponse();
    if (request.type == 'createAccount') {
      account = Account.NewAccount();
      info.account.privKey = account.getPrivateKeyString();
      info.account.pubKey = account.getPublicKeyString();
      info.account.keystore = account.toKeyString(request.password);
      info.unlockAccount.unlocked = true;
      chrome.storage.sync.set({ keystore: info.account.keystore }, function() {
        console.log("\tJust set new keystore");
      });
      sendResponse(info);
      neb.api.getAccountState(account.getAddressString()).then(function (state) {
        state = state.result || state;
        info.account.address = account.getAddressString();
        info.account.balance = state.balance;
        info.account.nonce = state.nonce;
        console.log('just updated account state, info: ', info);
        chrome.runtime.sendMessage({type: "moreInfo", info});
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {type: "activateNow"});
        });
        // if (callback) {
        //   callback(info);
        // }
        // sendResponse(info);
      }).catch(function (err) {
          console.log("err:",err);
      });
      // refreshAccountInfo(sendResponse);
      // sendResponse(info);
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // if (request.type != "unlockAccount") return sendResponse();
    if (request.type == 'unlockAccount') {
      account = new Account();
      try {
        account.fromKey(info.account.keystore, request.password);
        info.unlockAccount.unlocked = true;
        console.log(account);
      } catch (err) {
        info.unlockAccount.wrongPass = true;
      }
      sendResponse(info);
      neb.api.getAccountState(account.getAddressString()).then(function (state) {
        state = state.result || state;
        info.account.address = account.getAddressString();
        info.account.balance = state.balance;
        info.account.nonce = state.nonce;
        console.log('just updated account state, info: ', info);
        // sendResponse(info);
        chrome.runtime.sendMessage({type: "moreInfo", info});
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {type: "activateNow"});
        });
        // if (callback) {
        //   callback(info);
        // }
      }).catch(function (err) {
          console.log("err:",err);
      });
      // refreshAccountInfo(sendResponse);
      // sendResponse(info);
    }
});
