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
  testnet: 'n1segn8d15u5DPgVjCmyuTPdf94Uh3F7eUX'
}
const networkId = {
  testnet: 1001
}
const SECRETNOTE_URL = "Secret note";

let keystore;
let info = {
  network: 'testnet',
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
  savedCredentials: [],
  allCredentialsArray: [],
  pastTransactions: [],
  savedCredentials: [],
  backgroundImgURL: chrome.extension.getURL('images/get_started16.png')
};

// chrome.storage.sync.set({ pastTransactions: [] }, function() {
//   console.log("\tJust saved pastTransactions to storage");
// });

function setUpNeb() {
  neb.setRequest(new HttpRequest(`https://${info.network}.nebulas.io`));

  chrome.storage.sync.get('keystore', function(data) {
    info.account.keystore = data.keystore;
    openLoginTab();
  });
}
setUpNeb();

const listenForMessage = (type, callback) => {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === type) callback(request, sender, sendResponse);
  });
}

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

        const encryptedPasswords = JSON.parse(tx.result);
        for (const encryptedKey in encryptedPasswords) {
          console.log('encrypted key: ', encryptedKey);

          const key = decrypt(encryptedKey);
          console.log('key decrypted: ', key);
          const [ domain, login ] = key.split(':');
          if (!info.savedCredentials[domain]) info.savedCredentials[domain] = {};
          info.savedCredentials[domain][login] = encryptedPasswords[encryptedKey];
        }

        info.allCredentialsArray = [];
        for (domain in info.savedCredentials) {
          for (login in info.savedCredentials[domain]) {
            info.allCredentialsArray.push({
              domain,
              login,
              password: decrypt(info.savedCredentials[domain][login])
            })
          }
        }
        console.log('savedCredentials = ', info.savedCredentials);
        // chrome.runtime.sendMessage({type: "infoForPopup", info});
    });
  });
}

function savePastTransactionsToStorage() {
  chrome.storage.sync.set({ pastTransactions: info.pastTransactions }, function() {
    console.log("\tJust saved pastTransactions to storage");
  });
}

function setPassword(url, login, encryptedPass) {
  if (!info.unlockAccount.unlocked) return;
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    const encryptedKey = encrypt(`${url}:${login}`);
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
        args: `[\"${encryptedKey}\",\"${encryptedPass}\"]`
      }});
    tx.signTransaction();
    neb.api.sendRawTransaction(tx.toProtoString()).then(function (resp) {
      console.log(`Just set password for ${url} on contract, response is:`, resp);
      info.pastTransactions.push({
        type: "password",
        status: 2,
        url,
        login,
        txhash: resp.txhash,
      });
      savePastTransactionsToStorage();
      setTimeout(fetchSavedPasswords, 1000);
    });
  });
}

function sendNas(destination, amount) {
  if (!info.unlockAccount.unlocked) return;
  neb.api.getAccountState(account.getAddressString()).then(function (state) {
    let tx = new Transaction({
      chainID: networkId[info.network],
      from: account,
      to: destination,
      value: parseInt(amount * 1e18),
      nonce: parseInt(state.nonce) + 1,
      gasPrice: DEFAULT_GAS_PRICE,
      gasLimit: DEFAULT_GAS_LIMIT,
    });
    tx.signTransaction();
    neb.api.sendRawTransaction(tx.toProtoString()).then(function (resp) {
      console.log(`Just sent ${amount} NAS to ${destination} response is:`, resp);
      info.pastTransactions.push({
        type: "send",
        amount,
        destination,
        status: 2,
        txhash: resp.txhash,
      });
      savePastTransactionsToStorage();
    });
  });
}

// const testEncryptDecrypt = (raw) => {
//   // console.log('raw : ', raw);
//   var inBytes = aesjs.utils.utf8.toBytes(raw);
//   // console.log('bytes : ', inBytes);
//   var encryptedBytes = getAESInstance().encrypt(inBytes);
//   // console.log('encrypted bytes : ', encryptedBytes);
//   var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
//   // console.log('encrypted hex : ', encryptedHex);
//   var encryptedBytesFromHex = aesjs.utils.hex.toBytes(encryptedHex);
//   encryptedBytesFromHex = new Uint8Array(encryptedBytesFromHex);
//   // console.log('encrypted bytes : ', encryptedBytesFromHex);
//   var decryptedBytes = getAESInstance().decrypt(encryptedBytesFromHex);
//   // console.log('decrypted bytes : ', decryptedBytes);
//   var decryptedRaw = aesjs.utils.utf8.fromBytes(decryptedBytes);
//   // console.log('decrypted raw : ', decryptedRaw);
// };

function getAESInstance() {
  return new aesjs.ModeOfOperation.ctr(info.account.privKeyArray);
}

// function initAES() {
//   testEncryptDecrypt('hello');
// }

function openLoginTab() {
  if (info.account.keystore) {
    chrome.tabs.create({url : "html/login.html"});
  }
}

console.log("Yo");



listenForMessage('onTryLogin', (request, sender, sendResponse) => {
  console.log('User submited credentials: ', request.info);
  if ((info.savedCredentials[request.info.domain] === undefined) ||
      (info.savedCredentials[request.info.domain][request.info.login] === undefined)) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      info.tempCredentials.domain = request.info.domain;
      info.tempCredentials.login = request.info.login;
      info.tempCredentials.password = request.info.password;
      info.tempCredentials.tabId = tabs[0].id;
      console.log('Just set tabId of temp credentials to be ', tabs[0].id);
    });
  }
});

listenForMessage('sendNas', (request, sender, sendResponse) => {
  sendNas(request.destination, request.amount);
});

const refreshInfo = () => {
  if (info.unlockAccount.unlocked) {
    neb.api.getAccountState(account.getAddressString()).then(function (state) {
      state = state.result || state;
      info.account.address = account.getAddressString();
      info.account.balance = state.balance;
      info.account.nonce = state.nonce;
      console.log('just updated account state, info: ', info);
      chrome.runtime.sendMessage({type: "infoForPopup", info});
    }).catch(function (err) {
      console.log("err:",err);
    });
    fetchSavedPasswords();
  }

  for (const transaction of info.pastTransactions) {
    if (transaction.status !== 2) continue;
    neb.api.getTransactionReceipt({ hash: transaction.txhash }).then((receipt) => {
      transaction.status = receipt.status;
      savePastTransactionsToStorage();
    });
  }
}

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
  if (request.type == 'switchCredentials') {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'chooseCredentials',
        credentials: request.credentials,
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'uploadedKeystore') {
    info.account.keystore = request.keystore;
    sendResponse();
  }
});

listenForMessage('requestInfoForContent', (request, sender, sendResponse) => {
  let response = { unlocked: info.unlockAccount.unlocked };
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    console.log('current tab = ', tabs[0].id, ' while tab id of credentials = ', info.tempCredentials.tabId);

    const credentials = info.allCredentialsArray.filter(credential => credential.domain === request.domain);
    console.log('Broadcasting infoForContent');
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

const encrypt = (raw) => {
  console.log('raw : ', raw);
  var inBytes = aesjs.utils.utf8.toBytes(raw);
  console.log('bytes : ', inBytes);
  var encryptedBytes = getAESInstance().encrypt(inBytes);
  console.log('encrypted bytes : ', encryptedBytes);
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHex;
};

const decrypt = (encryptedHex) => {
  var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
  encryptedBytes = new Uint8Array(encryptedBytes);
  // console.log('encrypted bytes : ', encryptedBytes);
  var decryptedBytes = getAESInstance().decrypt(encryptedBytes);
  // console.log('decrypted bytes : ', decryptedBytes);
  var decryptedRaw = aesjs.utils.utf8.fromBytes(decryptedBytes);
  // console.log('decrypted raw : ', decryptedRaw);
  return decryptedRaw;
}

listenForMessage('saveNewCrendentials', (request, sender, sendResponse) => {
  info.tempCredentials = {};
  setPassword(request.credentials.domain, request.credentials.login, encrypt(request.credentials.password));
});

listenForMessage('createAccount', (request, sender, sendResponse) => {
  account = Account.NewAccount();
  info.account.privKey = account.getPrivateKeyString();
  info.account.pubKey = account.getPublicKeyString();
  info.account.privKeyArray = account.getPrivateKey();
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
    console.log('Account as just unlocked: ',account);
    chrome.storage.sync.set({ keystore: info.account.keystore }, function() {
      console.log("\tJust set new keystore");
    });
    chrome.storage.sync.get('pastTransactions', function(data) {
      info.pastTransactions = data.pastTransactions ? data.pastTransactions : [];
    });
  } catch (err) {
    info.unlockAccount.wrongPass = true;
  }
  refreshInfo();
  sendResponse(info);
  // initAES();
  fetchSavedPasswords();
});
