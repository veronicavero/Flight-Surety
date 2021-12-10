var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
var Web3 = require('web3');
//Web3.eth.defaultAccount = Web3.eth.accounts[0];
module.exports = {
  networks: {
    // development: {
    //   provider: function() {
    //     return new HDWalletProvider(mnemonic, "ws://127.0.0.1:7545/", 0, 50);
    //   },
    //   websockets: true,
    //   network_id: '*',
    //   gas: 9999999
    // } //HDWalletProvider does not support websockets
    development: {
      // host: "127.0.0.1",     // Localhost (default: none)
      // port: 7545,            // Standard Ethereum port (default: none)
      provider: function() {
        return new Web3.providers.WebsocketProvider("ws://127.0.0.1:7545/");
      },
      gas: 6666666,
      network_id: "*",       // Any network (default: none)
      websockets: true
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};