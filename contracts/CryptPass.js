"use strict";

var CryptPass = function () {
   LocalContractStorage.defineMapProperty(this, "userPasswords");
};

CryptPass.prototype = {
    init: function () {
    },

    setPassword: function (url, login, encryptedPassword) {
        var user = Blockchain.transaction.from;
        var index = this.size;
        var currentPasswordArray = this.userPasswords.get(user);
        if (!currentPasswordArray) {
          currentPasswordArray = {};
        }
        if (!currentPasswordArray[url]) {
          currentPasswordArray[url] = {};
        }
        currentPasswordArray[url][login] = encryptedPassword;
        this.userPasswords.set(user, currentPasswordArray);
    },

    getPasswords: function () {
        return this.userPasswords.get(Blockchain.transaction.from);
    },
};

module.exports = CryptPass;
