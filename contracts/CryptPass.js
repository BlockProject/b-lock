"use strict";

var CryptPass = function () {
   LocalContractStorage.defineMapProperty(this, "userPasswords");
};

CryptPass.prototype = {
    init: function () {
    },

    setPassword: function (key, encryptedPassword) {
        var user = Blockchain.transaction.from;
        var index = this.size;
        var currentPasswordDirectory = this.userPasswords.get(user);
        if (!currentPasswordDirectory) {
          currentPasswordDirectory = {};
        }
        currentPasswordDirectory[key] = encryptedPassword;
        this.userPasswords.set(user, currentPasswordDirectory);
    },

    getPasswords: function () {
        return this.userPasswords.get(Blockchain.transaction.from);
    },
};

module.exports = CryptPass;
