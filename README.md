# b.lock - The blockchain-powered password manager
#### Using encryption and blockchain technology, b.lock is a Chrome extension that helps you manage your passwords in a secure and trustless way such that only you have access to them.

![alt text](./images/block_logo-16px.png "B.Lock Password Manager")

### [Link to Chrome extension](https://chrome.google.com/webstore/detail/block-password-manager/hjbpkcanpblbdfeoogkbpkbjmacakmjn)

### Features:
- You can save the login credentials for different websites to b.lock. The saved credentials will be auto-filled when you visit the websites subsequently.
- You can also save "Secret notes" such as bank PIN numbers, metamask seed words,...
- b.lock acts as a Nebulas wallet as well. You can use it to keep NAS or send NAS to other accounts.

### How it works
* b.lock uses your Nebulas private key (in other words, the master key) to encrypt your passwords and secret notes.
* b.lock saves the encrypted passwords/secret notes on the Nebulas blockchain.
* Hence, your passwords will be accessible to you anytime and anywhere, as long as you have your private key
* No one but you can decrypt the encrypted passwords. Thus, you are truly in control of your passwords.

### How to use:
* Step 1: Download the chrome extension from [here](https://chrome.google.com/webstore/detail/block-password-manager/hjbpkcanpblbdfeoogkbpkbjmacakmjn)
* Step 2: Following the extension’s intructions, create your “keystore” (which is like your master key) and back it up. You can also import your existing Nebulas keystore.
* Step 3: Go to [this link](https://blockproject.io/faucet) and get your free Nebulas coins (which is needed to run b.lock. Don’t worry, $0.0001 worth of the coin is enough to use b.lock for your lifetime. Hence, we are giving it free to you)
* Step 4: Done, you can start using b.lock to save your passwords/secret notes

### Why blockchain?
* Password managers are essential these days, when we have to manage lots of different passwords (which shouldn't be reused)
* There are lots of potential problems with the existing centrailized password managers:
  * Single point of failure: if the server/database goes down, there goes your passwords
  * Trust issue: can you really trust that these closed-source softwares will not just read your passwords?
* b.lock solves all of these problems:
  * The passwords are stored on the decentralized database that is the Nebulas blockchain, hence it will not go down easily
  * The passwords are encrypted by your private key which belongs to only you. You are the only one who can see your saved passwords.

### Contract address
Our deployed contract on the mainnet Nebulas can be found [here](https://explorer.nebulas.io/#/address/n1qmQeLTUU6fPJMs1uwTadQZfgwfUAKEUJw).
