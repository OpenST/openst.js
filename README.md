# openst.js

OpenST is a framework for building token economies

```js
const erc20ContractAddress = '0xE8DFFa760042019A47e8D50B68EcF09F01CbF2cC';
const tokenRulesContractAddress = '0x599d9A845C46761ecb9E17E74B266393Cc90B675';

const Web3 = require('web3');
const web3Provider = new Web3('http://127.0.0.1:8545');

const OpenST = require('./index.js');
let openST = new OpenST(web3Provider, erc20ContractAddress, tokenRulesContractAddress);

const tokenHolderAddress = '0x729CC130c8A146c621330035B4D8F6BFABe52204';

let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

let ephemeralKey = '0x351011bba142328799af15b5ef15db26bb2a2aaf',
  spendingLimit = '10000000000000000000000000000',
  expirationHeight = '10000000000000000000000000000',
  wallet = '0x9355d063d0283cc15927ae18d574eecef880dc00',
  passphrase = 'testtest';

   web3Provider.eth.personal.unlockAccount(wallet, passphrase).then(async function () {
     let r = await tokenHolder.authorizeSession(ephemeralKey, spendingLimit, expirationHeight).send({
       from: wallet,
       gasPrice: '0x12A05F200'
     });
     
     console.log(r);
     
     return r;
   
   });

```