# .js

 is a framework for building token economies. Here, we walk through a sample usage of .

Below is overview of different components and their roles:

- Each Economy will have one TokenRules Contract deployed on it.
  The TokenRules Contract keeps a list of all the registered Custom Rule Contracts that are defined economy designers and helps in interacting with them.

- Each user in a token economy will be represented by a Token Holder contract.
  Branded Tokens can only be held by token holder contracts, and there contracts ensure that the tokens remain internal to the economy. This contract is a multi-sig contract. It may have multiple owner "wallets" controlled by the same natural person

- A partner company must have at least one Custom Rule Contract. They may have additional rules based on their economy goals


##### Install all the dependent packages
```
> sudo apt-get update
  sudo apt-get install nodejs
  sudo apt-get install npm
  sudo apt-get install software-properties-common
```

##### Setup

- Install .js in your project

  >npm install https://github.com/Foundation/.js#setup-mvp --save

-Install geth

  Note: The code has been tested with geth version: 1.7.3-stable.

    >curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.3-4bb3c89d.tar.gz | tar xvz
    mv geth-linux-amd64-1.7.3-4bb3c89d /usr/local/bin
    ln -s /usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d/geth /usr/local/bin/geth
    export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d"

- Sync your machine with one of these test networks

  * [Ropsten](https://ropsten.etherscan.io/), <br>
  * [Kovan](https://kovan.etherscan.io/), or
  * [Rinkeby](https://rinkeby.etherscan.io/ )


- Create the following addresses and fund them with gas.

    * deployerAddress: Address which will deploy ERC20Token, TokenRules, TokenHolder, Custom Rules contracts.
    * organizationAddress : Address which will register the custom Rule contracts to TokenRules.
    * wallet1 : Owner1 of TokenHolder contract.
    * wallet2 : Owner2 of TokenHolder contract.
    * ephemeralKey: Key which will be authorized by owners of the TokenHolder contract to sign execute custom Rule transactions.
    * facilitatorAddress: Address which will facilitate custom Rule transactions.

##### Reference Materials
[Web3 documentation](https://web3js.readthedocs.io/en/1.0/web3-eth.html)  

##### Initializing the chain on developer machines

The below command creates a json file (~/-setup/config.json) with all the needed addresses and other constants. It also starts Geth process for the chain.<br/>
This is meant for developer to get going directly and try out the functionality
of .js as described in the following sections.

```
> Clone .js

    git clone git@github.com:Foundation/.js.git

> Install npm packages

  cd .js
  git checkout setup-mvp
  npm install

> npm run init-dev-env
```

##### Sample Constants

To execute the sample code provided, please use below code after setting up the development environment using init-dev-env.
```js

const os = require('os');
let configFilePath = os.homedir() + '/-setup/config.json';
let devEnvConfig = require(configFilePath);

// Deployer address
let deployerAddress = devEnvConfig.deployerAddress;

// Organization address
let organizationAddress = devEnvConfig.organizationAddress;

// Wallet addresses
let wallet1 = devEnvConfig.wallet1;
let wallet2 = devEnvConfig.wallet2;

//Ephemeral Key Address
let ephemeralKey = devEnvConfig.ephemeralKey1;

let facilitatorAddress = devEnvConfig.facilitator;
let passphrase = 'testtest';

// Some other constants
const gasPrice = '0x12A05F200';
const gasLimit = 4700000;

// Helper function for reading json file
const fs = require('fs');
 function parseFile(filePath, options) {
 filePath = path.join(filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
 }

let mockTokenAbi = parseFile('./contracts/abi/MockToken.abi', 'utf8');
```

To set these constants to other values, please use the sample code below:

```js

// Deployer address
let deployerAddress = '0xaabb1122....................';

// Organization address
let organizationAddress = '0xaabb1122....................';

// Wallet addresses
let wallet1 = '0xaabb1122....................';
let wallet2 = '0xaabb1122....................';

let ephemeralKey = '0xaabb1122....................';

let facilitatorAddress = '0xaabb1122....................';


let passphrase = 'some passphrase.....';

// Some other constants
const gasPrice = '0x12A05F200';
const gasLimit = 4700000;

// Helper function for reading json file
const fs = require('fs');
 function parseFile(filePath, options) {
 filePath = path.join(filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
 }

let mockTokenAbi = parseFile('./contracts/abi/MockToken.abi', 'utf8');
```

##### Creating an  object

```js
// Creating a web3 js object using the Geth endpoint
const gethEndpoint = 'http://127.0.0.1:8545';

// Creating object of
const  = require('./index.js');
let  = new (gethEndpoint);
```

### Adding accounts
One can add accounts to web3 wallet or to our custom signer service. You should do only one of these and not both.

Remember to add all of the following to use the functionality described in this document.
* deployerAddress, <br/>
* organizationAddress, <br/>
* wallet1, <br/>
* wallet2, <br/>
* ephemeralKey, and <br/>
* facilitatorAddress


##### Add accounts to the web3 wallet
You can add accounts to the  web3 wallet either using the keystore file OR
 using the private key.<br>
Full documentation can be found [here](https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html)
```js
//Common step
// Fetch the web3 object to add to the wallet.
// Add all your accounts to this  web3 object.
let web3 = .web3();

// Adding accounts using keystore content.
// Read more about web3.eth.accounts.decrypt here:https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#id22
let addToWalletByKeystoreContent = function (encryptedPrivateKey, password) {
  let account = web3.eth.accounts.decrypt(encryptedPrivateKey, password);
  web3.eth.accounts.wallet.add(account);
};

```

#####  Signer Service
.js makes it easy for developers to build custom and secure key-management solutions.

You can build your own custom signer service. Once the signer service is set, you can continue to use [Contract.methods.myMethod.send](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send)  &  [web3.eth.sendTransaction](https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction) without worrying about unlocking/signing the transactions.<br> You can set the signer service using `.signers.setSignerService` method.

.js will call your service to determine the nonce of the sender, ask your service to sign the transaction and then submit the transaction.

You will need to provide the instance of  with an object that exposes the following functions:
```js

let signerServiceObject = {
  // nonce - method to provide nonce of the address.
  nonce: function ( address ) {
    return new Promise( function (resolve, reject) {
      //Your code here
      //...
      //...
      //...
      //resolve the promise with the nonce of the address
    });
  },

  // signTransaction - method to provide  with signed raw transaction.
  signTransaction: function (txObj, address) {
    // txObj - web3 transaction object.
    // address - address which needs to sign the transaction.

    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...
      // resolve the promise with the signed txObj that confirms to web3 standards:
      // https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#id5
      //
      // OR
      //
      // resolve the promise with signed rawTransaction (String).
    });
  },
  // sign - method to sign raw data.
  sign: function (dataToSign, address) {
    //dataToSign - raw data to sign.
    //address - address that needs to sign the transaction.
    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...

      // resolve the promise with the signed data.
    });
  }
};
```

.js comes with a sample Geth signer service that you can use for development purpose.

```js
let gethSigner = new .utils.GethSignerService(.web3());

gethSigner.addAccount(deployerAddress, passphrase);
gethSigner.addAccount(organizationAddress, passphrase);
gethSigner.addAccount(wallet1, passphrase);
gethSigner.addAccount(wallet2, passphrase);
gethSigner.addAccount(ephemeralKey, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);

.signers.setSignerService(gethSigner);
```

##### Deploying ERC20 contract (Optional)
To skip, you can use a pre-deployed ERC-20 contract address <br>
If, however, you choose deploy a new contract, the steps below will guide you through the process.

```js
// deploy ERC20 - if needed. Not mandatory
let erc20TokenContractAddress = null;

let InitERC20Token = .setup.InitERC20Token;
console.log('* Deploying ERC20 Token');

new InitERC20Token({
  deployerAddress: deployerAddress,
  deployerPassphrase: passphrase,
  gasPrice: gasPrice,
  gasLimit: gasLimit
}).perform().then(function(response){
  erc20TokenContractAddress = response.receipt.contractAddress;
  console.log('erc20TokenContractAddress noted down:', erc20TokenContractAddress);
});
```

##### Deploying TokenRules contract

TokenRules contract is deployed per Organization.Only the Organization can register Custom Rule contracts with TokenRules contract.

```js
// Deploy TokenRules contract
let tokenRulesContractAddress = null;

let InitTokenRules = .setup.InitTokenRules;
console.log('* Deploying TokenRules');

new InitTokenRules({
  deployerAddress: deployerAddress,
  deployerPassphrase: passphrase,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  args: [organizationAddress, erc20TokenContractAddress]
}).perform().then(function(response){
  tokenRulesContractAddress = response.receipt.contractAddress;
  console.log('tokenRulesContractAddress noted down:', tokenRulesContractAddress);
});

```

##### Deploying TokenHolder contract

A TokenHolder contract is deployed for every user in an economy. TokenHolder contract holds a user's utility tokens.

```js
let requirement = 2;
let wallets = [wallet1, wallet2];
let tokenHolderContractAddress = null;

// Setting first TokenHolder
console.log('* Deploying Token Holder Contract1');
let InitTokenHolder = .setup.InitTokenHolder;
new InitTokenHolder({
  deployerAddress: deployerAddress,
  deployerPassphrase: passphrase,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  args: [
    erc20TokenContractAddress,
    erc20TokenContractAddress, // This will be coGateway contract address. Passing dummy value for now.
    tokenRulesContractAddress,
    requirement,
    wallets
  ]
}).perform().then(function(response){
  tokenHolderContractAddress = response.receipt.contractAddress;
  console.log('tokenHolderContractAddress noted down:', tokenHolderContractAddress);
});

```

##### Authorize session

Using TokenHolder authorize session function, owners can register an ephemeral key. This is a multi-sig operation.

```js
let authorizeSession = async function (tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await .web3().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);

  let tokenHolder = new .contracts.TokenHolder(tokenHolderAddress);

  // Authorize an ephemeral public key
  let authorizeSession1Response = await tokenHolder
    .authorizeSession(ephemeralKey, spendingLimit, expirationHeight)
    .send({
      from: wallets[0],
      gasPrice: gasPrice,
      gas: gasLimit
    });

  console.log('authorizeSession1Response:', JSON.stringify(authorizeSession1Response, null));

  // Authorize an ephemeral public key
  let authorizeSession2Response = await tokenHolder
    .authorizeSession(ephemeralKey, spendingLimit, expirationHeight)
    .send({
      from: wallets[1],
      gasPrice: gasPrice,
      gas: gasLimit
    });

  console.log('authorizeSession2Response', JSON.stringify(authorizeSession2Response, null));

  let isAuthorizedEphemeralKeyResponse = await tokenHolder
    .isAuthorizedEphemeralKey(ephemeralKey).call({});

  console.log('isAuthorizedEphemeralKey:', isAuthorizedEphemeralKeyResponse);
};
authorizeSession(tokenHolderContractAddress, ephemeralKey, wallets);

```

##### Fund the TokenHolder(s)

Funding a user's TokenHolder lets us execute a sample transaction later.


```js
// Fund ERC20 tokens to the tokenHolderContractAddress
// If you are using the MockToken, following method can help you.
let fundERC20Tokens = async function() {
  const BigNumber = require('bignumber.js');
  let amountToTransfer = new BigNumber('1000000000000000000000');

  console.log('Funding ERC20 tokens to token holder:', tokenHolderContractAddress);

  let mockToken = new (.web3()).eth.Contract(mockTokenAbi, erc20TokenContractAddress);

  return mockToken.methods
    .transfer(tokenHolderContractAddress, amountToTransfer.toString(10))
    .send({
      from: deployerAddress,
      gasPrice: gasPrice,
      gas: gasLimit
    });
};
fundERC20Tokens().then(console.log);

```

##### Deploy Rule contract

A custom Rule contract can be used to define economy-specific rules.

```js
// Deploy Rule contract
let ruleContractAddress = null;

let InitRule = .setup.InitTransferRule;
console.log('* Deploying Rule');

new InitRule({
  deployerAddress: deployerAddress,
  deployerPassphrase: passphrase,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  args: [tokenRulesContractAddress]
}).perform().then(function(response){
  ruleContractAddress = response.receipt.contractAddress;
  console.log('ruleContractAddress noted down:', ruleContractAddress);
});

```

##### Register Rule

The Rules contract is registered inside TokenRules contract by Organization.

```js
// Register Rule
let registerRule = async function (ruleName, ruleContractAddress) {

  let tokenRules = new .contracts.TokenRules(tokenRulesContractAddress);

  return tokenRules.registerRule(ruleName, ruleContractAddress)
    .send({
      from: organizationAddress,
      gasPrice: gasPrice,
      gas: gasLimit
    })
};
registerRule('transferFrom', ruleContractAddress).then(console.log);
```

##### Execute a Rule

TokenHolder execute Rule can called for a whitelisted Rules contract only.
Here, an executable transaction is signed by the ephemeral key.The facilitator calls TokenHolder execute Rule method to execute custom Rule.
TokenHolder approves TokenRules for transfer. Transfers are called by TokenRules contract.

```js
let executeSampleRule = async function(tokenHolderAddress, ephemeralKey) {
  const BigNumber = require('bignumber.js');
  let tokenHolder = new .contracts.TokenHolder(tokenHolderAddress),
    amountToTransfer = new BigNumber(100);

  let transferRuleAbi = parseFile('./contracts/abi/TransferRule.abi', 'utf8');
  let transferRule = new (.web3()).eth.Contract(transferRuleAbi, ruleContractAddress);

  let methodEncodedAbi = await transferRule.methods
    .transferFrom(
      tokenHolderAddress,
      '0x66d0be510f3cac64f30eea359bda39717569ea4b',
      amountToTransfer.toString(10)
    ).encodeABI();

  let executableTransactionObject = new .utils.ExecutableTransaction({
    web3: .web3(),
    tokenHolderContractAddress: tokenHolderAddress,
    ruleContractAddress: ruleContractAddress,
    methodEncodedAbi: methodEncodedAbi,
    signer: ephemeralKey,
    signerPassphrase: passphrase,
    tokenHolderInstance: tokenHolder
  });
  let executableTransactionData = await executableTransactionObject.get();

  let executeRuleResponse = await tokenHolder
    .executeRule(
      tokenHolderAddress,
      ruleContractAddress,
      executableTransactionData.ephemeralKeyNonce,
      methodEncodedAbi,
      executableTransactionData.callPrefix,
      executableTransactionData.v,
      executableTransactionData.r,
      executableTransactionData.s
    ).send({
      from: facilitatorAddress,
      gasPrice: gasPrice,
      gas: gasLimit
    });

    return executeRuleResponse;
};
executeSampleRule(tokenHolderContractAddress, ephemeralKey).then(console.log);
```

##### Balance verification after execute rule

```js
let checkBalance = async function (address) {

  let mockToken = new (.web3()).eth.Contract(mockTokenAbi, erc20TokenContractAddress);
  return mockToken.methods.balanceOf(address).call({});
};
checkBalance(tokenHolderContractAddress).then(console.log)
```
