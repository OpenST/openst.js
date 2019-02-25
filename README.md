OpenST.js
============

![Build master](https://img.shields.io/travis/OpenSTFoundation/openst.js/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenSTFoundation/openst.js/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openstfoundation/openst.js.svg?style=flat)
![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)
![Chat on Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/SimpleToken.svg?style=flat)

OpenST.js supports interaction with openst-contracts.

##  Setup
This library assumes that nodejs and geth are installed and running. To install OpenST.js in your project using npm:

```bash
$ npm install @openstfoundation/openst.js --save
```

This code was tested with geth version: 1.7.3-stable. Other higher versions should also work.

## Creating a OpenST object
The OpenST object is an entry point: using the OpenST object, a staking can be initiated.

```js
// Creating OpenST.js object
const OpenST = require('@openstfoundation/openst.js');

```

## ABI and BIN provider

openst.js comes with an abi-bin provider for managing abi(s) and bin(s).

The abiBinProvider provides abi(s) and bin(s) for the following contracts:

* [TokenHolder](https://github.com/OpenSTFoundation/openst-contracts/blob/0.10.0-alpha.1/contracts/token/TokenHolder.sol) (TokenHolder contract deployed on UtilityChain)
* [TokenRules](https://github.com/OpenSTFoundation/openst-contracts/blob/0.10.0-alpha.1/contracts/token/TokenRules.sol) (TokenRules contract deployed on UtilityChain)
* [PricerRule](https://github.com/OpenSTFoundation/openst-contracts/blob/0.10.0-alpha.1/contracts/rules/PricerRule.sol) (PricerRule is a rule contract deployed on UtilityChain)
* [GnosisSafe](https://github.com/gnosis/safe-contracts/blob/v0.1.0/contracts/GnosisSafe.sol) (MultiSignature wallet with support for confirmations using signed messages)
* [DelayedRecoveryModule](https://github.com/OpenSTFoundation/openst-contracts/blob/0.10.0-alpha.1/contracts/gnosis_safe_modules/DelayedRecoveryModule.sol) (Allows to replace an owner without Safe confirmations) 
* [CreateAndAddModules](https://github.com/gnosis/safe-contracts/blob/v0.1.0/contracts/libraries/CreateAndAddModules.sol) (Allows to create and add multiple module in one transaction)
* [UserWalletFactory](https://github.com/OpenSTFoundation/openst-contracts/blob/0.10.0-alpha.1/contracts/proxies/UserWalletFactory.sol) (Creates proxy for GnosisSafe, TokenHolder and DelayedRecoveryModule)

```js

// Fetching ABI examples.
let abiBinProvider = new OpenST.AbiBinProvider();
const TokenHolderAbi = abiBinProvider.getABI('TokenHolder');

```

## Deploying contracts

## Constants
Before deploying contracts, please set some constants to funded addresses that you control.

```js

// Initialize web3 object using the geth endpoint
const Web3 = require('web3');
const web3Provider = new Web3('http://127.0.0.1:8545');

// organization owner. Doesn't need to be eth funded.
const organizationOwner = '0xaabb1122....................';

// deployer address
const deployerAddress = '0xaabb1122....................';

// Admin address. Doesn't need to be eth funded.
const adminAddress = '0xaabb1122....................';

// Relayer address
const relayer = '0xaabb1122....................';

// Worker address
const worker = '0xaabb1122....................';

const passphrase = 'some passphrase.....';

// Other constants
const gasPrice = '0x12A05F200';
const gas = 7500000;

```

### Deploy Organization contract

An Organization contract serves as an on-chain access control mechanism by assigning roles to a set of addresses.

```js
// Deploy Organization contract
const Mosaic = require('@openstfoundation/mosaic.js');
const { Organization } = Mosaic.ContractInteract;
const orgConfig = {
  deployer: deployerAddress,
  owner: organizationOwner,
  admin: admin,
  workers: [worker],
  workerExpirationHeight: '20000000' // This is the block height for when the the worker is set to expire.
};
let organizationContractInstance;
let organizationAddress;
Organization.setup(web3Provider, orgConfig).then(function(instance){
  organizationContractInstance = instance;
  organizationAddress = organizationContractInstance.address;
});

```

### Deploy EIP20Token contract

To perform economy setup, you will need an EIP20Token. You can either use an existing EIP20Token contract or deploy a new one.

### Deploy TokenRules contract
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const tokenRulesSetupObject = new OpenST.Setup.TokenRules(web3Provider);
let tokenRulesAddress;
tokenRulesSetupObject.deploy(organization, eip20Token, txOptions).then(function(response){
  tokenRulesAddress = response.receipt.contractAddress;
})

```   

### Deploy TokenHolder MasterCopy
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);
let tokenHolderMasterCopyAddress;
userSetup.deployTokenHolderMasterCopy(txOptions).then(function(response){
  tokenHolderMasterCopyAddress = response.receipt.contractAddress;
});

```  

### Deploy Gnosis MasterCopy
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);

let gnosisMasterCopyAddress;
userSetup.deployMultiSigMasterCopy(txOptions).then(function(response){
  gnosisMasterCopyAddress = response.receipt.contractAddress;
});

```  

### Deploy DelayedRecoveryModule MasterCopy
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);

let delayedRecoveryModuleMasterCopyAddress;
userSetup.deployDelayedRecoveryModuleMasterCopy(txOptions).then(function(response){
  delayedRecoveryModuleMasterCopyAddress = response.receipt.contractAddress;
});

```  

### Deploy CreateAndAddModules Contract
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);

let createAndAddModulesAddress;
userSetup.deployCreateAndAddModules(txOptions).then(function(response){
  createAndAddModulesAddress = response.receipt.contractAddress;
});

```  

### Deploy UserWalletFactory Contract
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);

let userWalletFactoryAddress;
userSetup.deployUserWalletFactory(txOptions).then(function(response){
  userWalletFactoryAddress = response.receipt.contractAddress;
});

```

### Deploy ProxyFactory Contract
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const userSetup = new OpenST.Setup.User(web3Provider);

let proxyFactoryAddress;
userSetup.deployProxyFactory(txOptions).then(function(response){
  proxyFactoryAddress = response.receipt.contractAddress;
});

``` 

### Deploy PricerRule Contract
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const rulesSetup = new OpenST.Setup.Rules(web3Provider);

const baseCurrencyCode = 'OST';
const conversionRate = 10;
const conversionRateDecimals = 5;
const requiredPriceOracleDecimals = 18;
let pricerRuleAddress;
rulesSetup.deployPricerRule(baseCurrencyCode, conversionRate, conversionRateDecimals, requiredPriceOracleDecimals, txOptions).then(function(response){
  pricerRuleAddress = response.receipt.contractAddress;
})

``` 

### Registration of Rule to TokenRules
<tbd>

```js
txOptions = {
  from: worker,
  gasPrice: gasPrice,
  gas: gas
};

const pricerRule = 'PricerRule';
const tokenRules = new OpenST.Helpers.TokenRules(tokenRulesAddress, web3Provider);
const pricerRuleAbi = abiBinProvider.getABI(pricerRule);
tokenRules.registerRule(pricerRule, pricerRuleAddress, pricerRuleAbi.toString(), txOptions).then(function(response){
  console.log("Successfully registered PricerRule");
})

``` 

### Creating a User Wallet
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const User = new OpenST.Helpers.User(
  tokenHolderMasterCopyAddress, 
  gnosisMasterCopyAddress, 
  delayedRecoveryModuleMasterCopyAddress, 
  createAndAddModulesAddress, 
  eip20Token, 
  tokenRulesAddress,
  userWalletFactoryAddress, 
  proxyFactoryAddress, 
  web3Provider
);
const owner = '0xaabb1122....................';
const ephemeralKey = '0xaabb1122....................';
const sessionKeySpendingLimit = 1000000;
const sessionKeyExpirationHeight = 100000000000; 
const owners = [owner];
const threshold = 1;
const recoveryOwnerAddress = '0xaabb1122....................';
const recoveryControllerAddress = '0xaabb1122....................';
const recoveryBlockDelay = 10;
let gnosisSafeProxy;
let userTokenHolderProxy;
User.createUserWallet(
  owners, 
  threshold, 
  recoveryOwnerAddress, 
  recoveryControllerAddress, 
  recoveryBlockDelay, 
  [ephemeralKey], 
  [sessionKeySpendingLimit], 
  [sessionKeyExpirationHeight], 
  txOptions
).then(function(response){
  const returnValues = response.events.UserWalletCreated.returnValues;
  const userWalletEvent = JSON.parse(JSON.stringify(returnValues));
  gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
  userTokenHolderProxy = userWalletEvent._tokenHolderProxy;
});

``` 

### Creating a Company Wallet
<tbd>

```js
txOptions = {
  from: deployerAddress,
  gasPrice: gasPrice,
  gas: gas
};
const User = new OpenST.Helpers.User(
  tokenHolderMasterCopyAddress,
  null, // gnosis safe master copy address
  null, // delayed recovery module master copy address
  null, // create and add modules contract address
  eip20Token,
  tokenRulesAddress,
  userWalletFactoryAddress,
  proxyFactoryAddress, // proxy factory address
  web3Provider
);
const owner = '0xaabb1122....................';
const ephemeralKey = '0xaabb1122....................';
const sessionKeySpendingLimit = 1000000;
const sessionKeyExpirationHeight = 100000000000; 
let companyTokenHolderProxy;
User.createCompanyWallet(
  owner,
  [ephemeralKey],
  [sessionKeySpendingLimit],
  [sessionKeyExpirationHeight],
  txOptions
).then(function(response){
  const returnValues = response.events.ProxyCreated.returnValues;
  const proxyEvent = JSON.parse(JSON.stringify(returnValues));
  companyTokenHolderProxy = proxyEvent._proxy;
});

``` 