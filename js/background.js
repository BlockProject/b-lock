// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// 'use strict';

// import { HttpRequest, Neb, Transaction, Unit, Account } from 'nebulas.js';
const HttpRequest = require('nebulas').HttpRequest;
const Neb = require('nebulas').Neb;
const Transaction = require('nebulas').Transaction;
const Unit = require('nebulas').Unit;
const Account = require('nebulas').Account;
let neb = new Neb();
let account = undefined;
const DEFAULT_GAS_LIMIT = 2000000;
const DEFAULT_GAS_PRICE = 1000000;
const contractAddress = {
  testnet: 'n1v7Kfdbw73jQmvaqvCp1MK8KucFN114Azx'
}
const networkId = {
  testnet: 1001
}

// const Key = require("nebulas").Key;
let keystore;
let info = {
  network: 'testnet',
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
  neb.setRequest(new HttpRequest(`https://${info.network}.nebulas.io`));

  chrome.storage.sync.get('keystore', function(data) {
    info.account.keystore = data.keystore;
  });
}
setUpNeb();

function fetchSavedPasswords() {
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    neb.api.call({
      chainID: networkId[info.network],
      from: info.account.address,
      to: contractAddress[info.network],
      value: 0,
      nonce: parseInt(state.nonce) + 1,
      gasPrice: DEFAULT_GAS_PRICE,
      gasLimit: DEFAULT_GAS_LIMIT,
      contract: {
         function: "getPasswords",
         args: ""
      }
    }).then(function(tx) {
        console.log('Result from fetching passwords: ', tx);
        info.savedCredentials = JSON.parse(tx.result);
        console.log('savedCredentials = ', info.savedCredentials);
        chrome.runtime.sendMessage({type: "moreInfo", info});
    });
  });
}

function setPassword(url, login, encryptedPass) {
  if (!info.unlockAccount.unlocked) return;
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    let tx = new Transaction({
      chainID: networkId[info.network],
      from: account,
      to: contractAddress[info.network],
      value: 0,
      nonce: parseInt(state.nonce) + 1,
      gasPrice: DEFAULT_GAS_PRICE,
      gasLimit: DEFAULT_GAS_LIMIT,
      contract: {
        function: "setPassword",
        args: `[\"${url}\",\"${login}\",\"${encryptedPass}\"]`
      }});
    tx.signTransaction();
    neb.api.sendRawTransaction(tx.toProtoString()).then(function (resp) {
      console.log(`Just set password for ${url} on contract, response is:`, resp);
      setTimeout(fetchSavedPasswords, 5000);
    });
  });
}

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
    let credentials = info.savedCredentials[request.domain];
    if (credentials) {
      credentials = {
        domain: request.domain,
        login: credentials[0],
        password: credentials[1]
      };
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
    fetchSavedPasswords();
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
    // info.savedCredentials.push(request.credentials);
    setPassword(request.credentials.domain, request.credentials.login, request.credentials.password);
    chrome.browserAction.setBadgeText({text: ''});
  }
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
        fetchSavedPasswords();
        // setPassword('google.com', 'vu', 'testPass');

      }).catch(function (err) {
          console.log("err:",err);
      });
      // refreshAccountInfo(sendResponse);
      // sendResponse(info);
    }
});
