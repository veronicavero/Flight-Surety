# FlightSurety

FlightSurety is an application project Flight Surety.

Programming Library
Truffle v5.4.22 (core: 5.4.22)
Solidity - ^0.4.24 (solc-js)
Node v10.15.0
Web3.js v1.5.3

Environment Setup
Metamask
Ganache
    Version 2.5.4 (2.5.4.1367) 
MacOX
    MacOX Big Sur (Version 11.6)

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp (using HTML, CSS and JS) and server app.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js --network development`
`truffle test ./test/oracles.js --network development`
`truffle test ./test/flight.js --network development`
`truffle test ./test/passengers.js --network development`

To use the dapp:

`truffle migrate --network development`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)