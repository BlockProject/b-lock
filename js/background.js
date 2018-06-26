const HttpRequest = require('nebulas').HttpRequest;
const Neb = require('nebulas').Neb;
const Transaction = require('nebulas').Transaction;
const Unit = require('nebulas').Unit;
const Account = require('nebulas').Account;
let neb = new Neb();
let account = undefined;
const DEFAULT_GAS_LIMIT = 2000000;
const DEFAULT_GAS_PRICE = 2000000;
const contractAddress = {
  testnet: 'n1segn8d15u5DPgVjCmyuTPdf94Uh3F7eUX',
  mainnet: 'n1qmQeLTUU6fPJMs1uwTadQZfgwfUAKEUJw'
}
const networkId = {
  testnet: 1001,
  mainnet: 1
}
const SECRETNOTE_URL = "Secret note";

const MAX_NONCE = 1e16;
// const MAX_NONCE = 2 ** 128;

let keystore;
const initialInfo = {
  lastNonce: 0,
  network: 'mainnet',
  account: {
    address: undefined,
    privKey: undefined,
    privKeyArray: undefined,
    pubKey: undefined,
    nonce: undefined,
    keystore: undefined,
    balance: undefined,
  },
  unlockAccount: {
    unlocked: false,
    wrongPass: false,
  },
  tempCredentials: {},
  tempTxhash: undefined,
  savedCredentials: {},
  allCredentialsArray: {
    'testnet': [],
    'mainnet': []
  },
  pastTransactions: {
    'testnet': [],
    'mainnet': []
  },
  usedCounters: {
    'testnet': {},
    'mainnet': {}
  },
  // agreedToPolicy: undefined,
  backgroundImgURL: chrome.extension.getURL('images/block_logo-16px.png'),
};
let info = JSON.parse(JSON.stringify(initialInfo));

function setUpNeb(openNewTab) {
  chrome.storage.sync.get('network', function(data) {
    info.network = data.network ? data.network : 'mainnet';

    neb.setRequest(new HttpRequest(`https://${info.network}.nebulas.io`));

    chrome.storage.sync.get('keystore', function(data) {
      info.account.keystore = data.keystore;
      if (openNewTab) {
        openLoginTab();
      }

      // chrome.storage.sync.get('agreedToPolicy', (data) => {
      //   info.agreedToPolicy = data.agreedToPolicy;
      // })
    });
  });
}
setUpNeb(true);

// chrome.storage.sync.set({ pastTransactions: info.pastTransactions }, function() {
//   console.log("\tJust saved pastTransactions to storage: ", info.pastTransactions);
// });

const listenForMessage = (type, callback) => {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === type) callback(request, sender, sendResponse);
  });
}

function fetchSavedPasswords(network) {
  // console.log("Fetching saved passwords for network ", network);
  if (!info.unlockAccount.unlocked) return;
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    neb.api.call({
      chainID: networkId[network],
      from: info.account.address,
      to: contractAddress[network],
      value: 0,
      nonce: parseInt(state.nonce) + 1,
      gasPrice: DEFAULT_GAS_PRICE,
      gasLimit: DEFAULT_GAS_LIMIT,
      contract: {
         function: "getPasswords",
         args: ""
      }
    }).then(function(tx) {
        // console.log('Result from fetching passwords: ', tx);
        // if (tx.error)
        const encryptedPasswords = JSON.parse(tx.result);

        if (!info.savedCredentials[network]) info.savedCredentials[network] = {};

        for (const encryptedKey in encryptedPasswords) {
          // console.log('encrypted key: ', encryptedKey);

          const key = decrypt(encryptedKey);
          // console.log('key decrypted: ', key);
          const [ domain, login ] = key.split(':');
          if (!info.savedCredentials[network][domain]) info.savedCredentials[network][domain] = {};
          info.savedCredentials[network][domain][login] = encryptedPasswords[encryptedKey];

          info.usedCounters[network][counterFromNonce(getNonceFromEncryptedHex(encryptedKey))] = true;
          info.usedCounters[network][counterFromNonce(getNonceFromEncryptedHex(encryptedPasswords[encryptedKey]))] = true;
        }

        info.allCredentialsArray[network] = [];
        for (domain in info.savedCredentials[network]) {
          for (login in info.savedCredentials[network][domain]) {
            info.allCredentialsArray[network].push({
              domain,
              login,
              password: decrypt(info.savedCredentials[network][domain][login])
            });

          }
        }
        // console.log('savedCredentials = ', info.savedCredentials);
        // chrome.runtime.sendMessage({type: "infoForPopup", info});
    });
  });
}

function savePastTransactionsToStorage() {
  chrome.storage.sync.set({ pastTransactions: info.pastTransactions }, function() {
    // console.log("\tJust saved pastTransactions to storage: ", JSON.parse(JSON.stringify(info.pastTransactions)));
  });
}

function setPassword(url, login, password) {
  const encryptedPass = encrypt(password);
  if (!info.unlockAccount.unlocked) return;
  const encryptedKey = encrypt(`${url}:${login}`);
  info.pastTransactions[info.network].push({
    type: password === "" ? "delete" : "password",
    status: 3,
    txIndex: info.pastTransactions[info.network].length,
    url,
    login,
    tx: {
      chainID: networkId[info.network],
      to: contractAddress[info.network],
      value: 0,
      contract: {
        function: "setPassword",
        args: `[\"${encryptedKey}\",\"${encryptedPass}\"]`
      }
    }
  });
  savePastTransactionsToStorage();
}

function sendNas(destination, amount) {
  console.log("Sending NAS");
  if (!info.unlockAccount.unlocked) return;
  info.pastTransactions[info.network].push({
    type: "send",
    amount,
    destination,
    status: 3, // queued
    txIndex: info.pastTransactions[info.network].length,
    tx: {
      chainID: networkId[info.network],
      to: destination,
      value: parseInt(amount * 1e18),
    }
  });
  savePastTransactionsToStorage();
}

const sendQueuedTx = (queuedTx) => {
  console.log("Sending queued tx", queuedTx);
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    queuedTx.tx.gasPrice = DEFAULT_GAS_PRICE;
    queuedTx.tx.gasLimit = DEFAULT_GAS_LIMIT;
    queuedTx.tx.nonce = parseInt(state.nonce) + 1;
    if (queuedTx.tx.nonce <= info.lastNonce) return;
    queuedTx.tx.from = account;
    let tx = new Transaction(queuedTx.tx);
    tx.signTransaction();
    queuedTx.tx.from = {};

    neb.api.sendRawTransaction(tx.toProtoString()).then(function (resp) {
      console.log(`Just sent raw Tx, response is:`, resp);
      queuedTx.status = 2;
      queuedTx.txhash = resp.txhash
      info.lastNonce = queuedTx.tx.nonce;
      savePastTransactionsToStorage();
    });
  });
}

function getAESInstance() {
  return new aesjs.ModeOfOperation.ctr(info.account.privKeyArray);
}

const counterFromNonce = (nonce) => parseInt(sha256(sha256(info.account.privKeyArray).concat(
  aesjs.utils.hex.fromBytes(aesjs.utils.utf8.toBytes(`b.lock is awesome ${info.network}`))
)), 16) % nonce;

function getAESInstanceWithNonce(nonce) {
  const counter = counterFromNonce(nonce);
  // return new aesjs.ModeOfOperation.ctr(sha256.array(info.account.privKeyArray), new aesjs.Counter(counter));
  return info.network == "mainnet" ?
    new aesjs.ModeOfOperation.ctr(sha256.array(info.account.privKeyArray), new aesjs.Counter(counter))
    : new aesjs.ModeOfOperation.ctr(sha256(sha256.array(info.account.privKeyArray)), new aesjs.Counter(counter))
}

function openLoginTab() {
  if (info.account.keystore) {
    chrome.tabs.create({url : "html/login.html"});
  }
}

// console.log("Yo");



listenForMessage('onTryLogin', (request, sender, sendResponse) => {
  // console.log('User submited credentials: ', request.info);
  if ((info.savedCredentials[info.network][request.info.domain] === undefined) ||
      (info.savedCredentials[info.network][request.info.domain][request.info.login] === undefined)) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      info.tempCredentials.domain = request.info.domain;
      info.tempCredentials.login = request.info.login;
      info.tempCredentials.password = request.info.password;
      info.tempCredentials.tabId = tabs[0].id;
      // console.log('Just set tabId of temp credentials to be ', tabs[0].id);
    });
  }
});

// listenForMessage('agreePolicy', (request, sender) => {
//   info.agreedToPolicy = true;
//   chrome.storage.sync.set({ agreedToPolicy: true});
// });

listenForMessage('sendNas', (request, sender, sendResponse) => {

  sendNas(request.destination, request.amount);
});

listenForMessage('changeNetwork', (request, sender, sendResponse) => {
  // console.log("changing network to ", request.network);
  if (!(request.network in networkId)) return;
  info.network = request.network;
  console.log("changed network to ", request.network);
  neb.setRequest(new HttpRequest(`https://${info.network}.nebulas.io`));
  refreshInfo();
  chrome.storage.sync.set({ network: info.network }, function() {
    // console.log("\tJust saved network setting to storage");
  });
});

const refreshInfo = () => {
  if (!info.unlockAccount.unlocked) return;
  console.log('refresing info, current info = ', JSON.parse(JSON.stringify(info)));
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    state = state.result || state;
    info.account.address = account.getAddressString();
    info.account.balance = state.balance;
    info.account.nonce = state.nonce;
    // console.log('just updated account state, info: ', info);
    chrome.runtime.sendMessage({type: "infoForPopup", info});
  }).catch(function (err) {
    console.log("err:",err);
  });
  fetchSavedPasswords(info.network);


  // just need to get the last transaction that is pending
  const pendingTx = info.pastTransactions[info.network].filter((tx) => tx.status == 2)[0];

  if (pendingTx) {
    console.log('Got pending tx: ', pendingTx);


    neb.api.getTransactionReceipt({ hash: pendingTx.txhash }).then((receipt) => {
      pendingTx.status = receipt.status;
      if (pendingTx.tx.nonce <= info.account.nonce && pendingTx.status == 2) {
        pendingTx.status = 0;
      }
      savePastTransactionsToStorage();
    }).catch((err) => {
    });
  } else {
    const queuedTx = info.pastTransactions[info.network].filter((tx) => tx.status == 3)[0];
    if (!queuedTx) return;
    console.log('Got queued tx: ', queuedTx);
    sendQueuedTx(queuedTx);
  }
}
setInterval(refreshInfo, 10000);

listenForMessage('requestInfo', (request, sender, sendResponse) => {
  sendResponse(info);
  refreshInfo();
});

listenForMessage('clearTempCredentials', (request, sender, sendResponse) => {
    info.tempCredentials = {};
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'hideIframe') {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'clearIframe',
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'chooseCredentials') {
    // console.log("Filling credentials: ", request.credentials);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'chooseCredentials',
        credentials: request.credentials,
      });
    });
  }
});

const resetInfoForNewAccount = () => {
  info = JSON.parse(JSON.stringify(initialInfo));
  chrome.storage.sync.set({ pastTransactions: {
    'testnet': [],
    'mainnet': []
  }});
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'uploadedKeystore') {
    info.account.keystore = request.keystore;
    refreshInfo();
    sendResponse();
  }
});

listenForMessage('requestInfoForContent', (request, sender, sendResponse) => {
  let response = { unlocked: info.unlockAccount.unlocked };
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    // console.log('current tab = ', tabs[0].id, ' while tab id of credentials = ', info.tempCredentials.tabId);

    const credentials = info.allCredentialsArray[info.network].filter(credential => credential.domain === request.domain);
    // console.log('Broadcasting infoForContent');
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'infoForContent',
      unlocked: info.unlockAccount.unlocked,
      showSavePasswordDialog: tabs[0].id === info.tempCredentials.tabId,
      autofill: credentials.length > 0,
      credentials,
      imgURL: info.backgroundImgURL,
    });
  });
  sendResponse();
});

// const getRandomNonce = () => {
//   let nonce = 0;
//   const randomValues = crypto.getRandomValues(new Int32Array(4));
//   for (let i = 0; i < 4; i++) {
//     nonce = nonce * (2 ** 32) + randomValues[i] + (2 ** 31);
//   }
//   return nonce;
// };

const encrypt = (raw) => {
  // console.log('raw : ', raw);
  const getRandomNonce = () => Math.floor(Math.random() * MAX_NONCE);
  let nonce = getRandomNonce();
  while (info.usedCounters[info.network][counterFromNonce(nonce)]) {
    nonce = getRandomNonce();
  }
  info.usedCounters[info.network][counterFromNonce(nonce)] = true;

  // const nonce = getRandomNonce();
  var inBytes = aesjs.utils.utf8.toBytes(raw);
  // console.log('bytes : ', inBytes);
  var encryptedBytes = getAESInstanceWithNonce(nonce).encrypt(inBytes);
  // console.log('encrypted bytes : ', encryptedBytes);
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  encryptedHex = encryptedHex.concat(":::").concat(nonce.toString(16));
  return encryptedHex;
};

const getNonceFromEncryptedHex = (encryptedHex) => {
  const nonceHex = encryptedHex.split(":::")[1];
  return parseInt(nonceHex, 16);
}

const decrypt = (encryptedHex) => {
  const splitArr = encryptedHex.split(":::");
  let aesInstance;
  if (splitArr.length == 2) {
    aesInstance = getAESInstanceWithNonce(getNonceFromEncryptedHex(encryptedHex));
  } else {
    aesInstance = getAESInstance();
  }
  encryptedHex = splitArr[0];
  var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
  encryptedBytes = new Uint8Array(encryptedBytes);
  // console.log('encrypted bytes : ', encryptedBytes);
  var decryptedBytes = aesInstance.decrypt(encryptedBytes);
  // console.log('decrypted bytes : ', decryptedBytes);
  var decryptedRaw = aesjs.utils.utf8.fromBytes(decryptedBytes);
  // console.log('decrypted raw : ', decryptedRaw);
  return decryptedRaw;
}

listenForMessage('saveNewCrendentials', (request, sender, sendResponse) => {
  info.tempCredentials = {};
  // console.log('Saving new credentials here: ', request.credentials);
  setPassword(request.credentials.domain, request.credentials.login, request.credentials.password);
});

listenForMessage('logout', (request, sender, sendResponse) => {
  console.log('Loging out ...');
  info = JSON.parse(JSON.stringify(initialInfo));
  setUpNeb(false);
});

listenForMessage('createAccount', (request, sender, sendResponse) => {
  account = Account.NewAccount();
  resetInfoForNewAccount();
  info.account.privKey = account.getPrivateKeyString();
  info.account.pubKey = account.getPublicKeyString();
  info.account.privKeyArray = account.getPrivateKey();
  info.account.address = account.getAddressString();
  info.account.keystore = account.toKeyString(request.password);
  info.unlockAccount.unlocked = true;
  chrome.storage.sync.set({ keystore: info.account.keystore }, function() {
    console.log("\tJust set new keystore");
  });
  refreshInfo();
  sendResponse(info);
});

listenForMessage('unlockAccount', (request, sender, sendResponse) => {
  account = new Account();
  try {
    account.fromKey(info.account.keystore, request.password);
    info.unlockAccount.unlocked = true;
    info.account.privKey = account.getPrivateKeyString();
    info.account.pubKey = account.getPublicKeyString();
    info.account.privKeyArray = account.getPrivateKey();
    info.account.address = account.getAddressString();
    // console.log('Account as just unlocked: ',account);
    chrome.storage.sync.set({ keystore: info.account.keystore }, function() {
      console.log("\tJust set keystore");
    });
    chrome.storage.sync.get('pastTransactions', function(data) {
      if (data.pastTransactions) {
        if (!('testnet' in data.pastTransactions)) {
          console.log('Wrong format of pastTransactions, reseting');
          data.pastTransactions = info.pastTransactions;
        }
        info.pastTransactions = data.pastTransactions;
      }
    });
  } catch (err) {
    info.unlockAccount.wrongPass = true;
  }
  refreshInfo();
  sendResponse(info);
});
