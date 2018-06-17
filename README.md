# B.Lock Password Manager

![alt text](./images/block_logo-16px.png "B.Lock Password Manager")

### What is B.Lock
B.Lock is a blockchain-based password manager and currently can be used as a browser extension. It is built on the Nebulas public blockchain and is powered by the NAS token.

### What can it do
B.Lock currently supports storing login credentials and secret notes. It is also a Nebulas wallet, and users can send NAS transactions too. B.Lock will prompt you whenever you login/register using a new set of credentials on a domain.

### Why Blockchain
As we create credentials with more and more websites, we tend to re-use the passwords. This is a major security threat to a user. Password Managers were made to make this credentials management convenient for users. But these password managers still have a single point of failure. What if their servers are down? What if their databases get hacked? Also, using such software is a major trust issue because the code is private and hence cannot be verified.

B.Lock encrypts every entry with the user's Nebulas private key. The encrypted data is then stored on the public blockchain. No outages, no single point of failure. The data is then decrypted in the extension before using it to login. So the passwords never leave your machine, and are always available (thanks to blockchain!). All you need to do is backup your Nebulas keystore.

### Details
This repository is the chrome extension for B.Lock. Our deployed contract on the mainnet Nebulas can be found [here](https://explorer.nebulas.io/#/address/n1qmQeLTUU6fPJMs1uwTadQZfgwfUAKEUJw).
