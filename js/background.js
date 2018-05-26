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
  }
};

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        // pageUrl: {hostEquals: 'developer.chrome.com'},
      })
      ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

function setUpNeb() {
  neb = new Neb();
  neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));

  chrome.storage.sync.get('keystore', function(data) {
    info.account.keystore = data.keystore;
  });
}
setUpNeb();

function refreshAccountInfo() {
  console.log('about to send info:', info);
  chrome.runtime.sendMessage({type: "info", info});

  if (account == undefined) return;
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    state = state.result || state;
    info.account.address = account.getAddressString();
    info.account.balance = state.balance;
    info.account.nonce = state.nonce;
    console.log('just updated account state, info: ', info);
    chrome.runtime.sendMessage({type: "info", info});
  }).catch(function (err) {
      console.log("err:",err);
  });
}
setInterval(refreshAccountInfo, 2000);

console.log("Yo");

// template for listening for messages from other scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type == "someTopic")
    sendResponse();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type != "createAccount") return sendResponse();

    account = Account.NewAccount();
    info.account.privKey = account.getPrivateKeyString();
    info.account.pubKey = account.getPublicKeyString();
    info.account.keystore = account.toKeyString(request.password);
    info.unlockAccount.unlocked = true;
    chrome.storage.sync.set({ keystore: info.account.keystore }, function() {
      console.log("\tJust set new keystore");

    });
    refreshAccountInfo();
    sendResponse();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type != "unlockAccount") return sendResponse();

    account = new Account();
    try {
      account.fromKey(info.account.keystore, request.password);
      info.unlockAccount.unlocked = true;
      console.log(account);
    } catch (err) {
      info.unlockAccount.wrongPass = true;
    }
    refreshAccountInfo();
    sendResponse();
});
