OpenST.js
============

OpenST is a framework for building token economies. Here are steps to get started with OpenST.js. In order to view an example, please visit our example repo, [OpenST.js Examples](https://github.com/OpenSTFoundation/openst-js-examples).

#### Overview of different components:

1. TokenRules contract: The TokenRules contract keeps a list of all the registered rule contracts with their properties and helps in interacting with them. Each economy must have one TokenRules contract deployed.

2. TokenHolder contracts: Each user in a token economy will be represented by a TokenHolder contract. The TokenHolder contract will hold the user’s tokens. It’s a multi-sig contract (i.e it can have multiple ownership keys, presumably owned by a single natural person).

3. Rule contracts: These contracts contains business logic that the economy creator uses to achieve their community or business goals. Each economy must have at least one rule contract.

#### Below is an overview of the different steps in this file:

1. [Basic setup](#basic-setup)
2. [Setting up the developer environment](#setting-up-the-developer-environment)
3. [Creating an OpenST object](#creating-an-openst-object)
4. [Adding accounts](#adding-accounts)
5. [Deploying an EIP20 contract](#deploying-an-erc20-contract)
6. [Economy setup](#economy-setup)
7. [User setup](#user-setup)
8. [Balance verification: Before execute rule](#balance-verification-before-execute-rule)
9. [Execute sample rule](#execute-sample-rule)
10. [Balance verification: After execute rule](#balance-verification-after-execute-rule)

#### Basic setup

1.  Install the following packages

```bash
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm
sudo apt-get install software-properties-common
```

2.  Install OpenST.js in your project

```bash
npm install https://github.com/OpenSTFoundation/openst.js#develop --save
```

3.  Install Geth

    This code was tested with geth version: 1.7.3-stable. Other higher versions should also work.

```bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.3-4bb3c89d.tar.gz | tar xvz
mv geth-linux-amd64-1.7.3-4bb3c89d /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d"
```

4.  Sync your development machine with one of the following test environments

    - https://ropsten.etherscan.io/
    - https://kovan.etherscan.io/
    - https://rinkeby.etherscan.io/

5.  Create the following addresses and fund them with gas

    - deployerAddress - address that deploys the ERC20Token, TokenRules, TokenHolder, and rule contracts
    - organizationAddress - address that registers rule contracts in the TokenRules contract
    - wallet1 - owner1 of the TokenHolder contract
    - wallet2 - owner2 of the TokenHolder contract
    - ephemeralKey - the key that will be authorized by owners in the TokenHolder contract; this key will sign execute rule transactions
    - facilitatorAddress - the address that will facilitate execute rule transactions

#### Setting up the developer environment

###### Clone OpenST.js repository

```bash
git clone git@github.com:OpenSTFoundation/openst.js.git
```

###### Install npm packages

```bash  
cd openst.js
git checkout develop
npm install
```

###### Initialize the chain on developer machine

The below command creates a json file (`~/openst-setup/config.json`) with all the needed addresses and other constants. It also starts Geth process for the chain.

This is a quick-start option. You could also choose to do this step manually.

```bash
node ./tools/initDevEnv.js ~
```

#### Creating an OpenST object
OpenST.js is a thin layer over web3.js. Its constructor arguments are same as that of web3.js.


```js
// Creating web3 object using the geth endpoint
const web3Provider = 'http://127.0.0.1:8545';

// Creating OpenST object
const OpenST = require('./index.js');
let openST = new OpenST( web3Provider );
```

OpenST.js also provides access to the web3.js object it creates and uses.
```js
// fetch the web3 object to add to the wallet
let web3 = openST.web3();
```

###### Sample constants
Please use below code if you have set up development environment using init-dev-env.

```js
const os = require('os');
let configFilePath = os.homedir() + '/openst-setup/config.json';
let devEnvConfig = require(configFilePath);

// deployer address
let deployerAddress = devEnvConfig.deployerAddress;

// organization address
let organizationAddress = devEnvConfig.organizationAddress;

// wallet addresses
let wallet1 = devEnvConfig.wallet1;
let wallet2 = devEnvConfig.wallet2;

let facilitatorAddress = devEnvConfig.facilitator;
let passphrase = 'testtest';

// some other constants
const gasPrice = '0x12A05F200';
const gas = 8000000;
```

Optionally, you can set these constants to other addresses and data that you may prefer.
Please remember to use only addresses that you are able to access

```js
// deployer address
let deployerAddress = '0xaabb1122....................';

// organization address
let organizationAddress = '0xaabb1122....................';

// wallet addresses
let wallet1 = '0xaabb1122....................';
let wallet2 = '0xaabb1122....................';

let ephemeralKey = '0xaabb1122....................';

let facilitatorAddress = '0xaabb1122....................';

let passphrase = 'some passphrase.....';

// some other constants
const gasPrice = '0x12A05F200';
const gas = 8000000;
```

###### ABI and BIN provider

OpenST.js comes with an in-built abi-bin provider for managing abi(s) and bin(s).

The abiBinProvider provides developers with following abi(s) and bin(s):

* [MockToken](https://github.com/OpenSTFoundation/mosaic-contracts/blob/v0.9.3-rc1/contracts/SimpleToken/MockToken.sol) (an EIP20 contract with name 'MockToken')
* [TokenRules](https://github.com/OpenSTFoundation/openst-contracts/blob/develop/contracts/TokenRules.sol) (a registry of rule contracts and the conduit for transfers)
* [TokenHolder](https://github.com/OpenSTFoundation/openst-contracts/blob/develop/contracts/TokenHolder.sol) (a multi-sig wallet that can hold tokens)
* [TransferRule](https://github.com/OpenSTFoundation/openst-contracts/blob/develop/contracts/TransferRule.sol) (a simple transfer rule contract)

```js
// Get the MockToken ABI
let abiBinProvider = openST.abiBinProvider();
let mockTokenAbi = abiBinProvider.getABI('MockToken');
```

#### Adding accounts
One can add accounts to web3 wallet or to our custom signer service. Please choose only ONE of the options described below.

Remember to add all of deployerAddress, organizationAddress, wallet1, wallet2, ephemeralKey and facilitatorAddress to use the functionality given in this readme.

###### Option 1: Add accounts to web3 wallets
For adding to web3 wallet, there are 2 ways. We can add using the keystore file OR by private key. If you choose this option, you could also choose to connect to an [infura endpoint](https://infura.io/docs) rather than running a full geth node.

Detailed documentation on adding accounts can be found here: https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html

```js
// Here is a sample helper method for developers to add an account to the wallet using keystore content
// Read more about web3.eth.accounts.decrypt here: https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#id22
let addToWalletByKeystoreContent = function (encrhttps://infura.io/docsyptedPrivateKey, password) {
  let account = web3.eth.accounts.decrypt(encryptedPrivateKey, password);
  web3.eth.accounts.wallet.add(account);
};
```

###### Option 2: OpenST Signers Service

You can set the signer service using `openST.signers.setSignerService` method. To use the signer service, you must have a full geth node running locally.

Once the signer service is set up, you can continue to use [Contract.methods.myMethod.send](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send) and [web3.eth.sendTransaction](https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction) without worrying about unlocking/signing the transactions.

OpenST.js will call your service to determine the nonce of the sender, ask your service to sign the transaction and then submit the transaction.

All you need to do is provide the instance of OpenST with an object that exposes three functions:
```js
let signerServiceObject = {
  // nonce - method to provide nonce of the address
  nonce: function ( address ) {
    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...
      // resolve the promise with the nonce of the address
    });
  },

  // signTransaction - method to provide openST with signed raw transaction
  signTransaction: function (txObj, address) {
    // txObj - web3 transaction object
    // address - address which needs to sign the transaction

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
      // resolve the promise with signed rawTransaction (String)
    });
  },
  // sign - method to sign raw data
  sign: function (dataToSign, address) {
    // dataToSign - raw data to sign
    // address - address that needs to sign the transaction
    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...

      // resolve the promise with the signed data
    });
  }
};
```

OpenST.js comes with a sample Geth signer service that you can use for development.

```js
let gethSigner = new openST.utils.GethSignerService(openST.web3());

gethSigner.addAccount(deployerAddress, passphrase);
gethSigner.addAccount(organizationAddress, passphrase);
gethSigner.addAccount(wallet1, passphrase);
gethSigner.addAccount(wallet2, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);

openST.signers.setSignerService(gethSigner);
```

###### OpenST Deployer

OpenST.js comes with a Deployer class that can deploy MockToken, TokenRules, TransferRule, and TokenHolder contracts.

```js
let deployerParams = {
  "from": deployerAddress,
  "gasPrice": gasPrice,
  "gas": gas
};
let deployer = new openST.Deployer( deployerParams );
```

#### Deploying an EIP20 contract

To create a token economy, you will want an EIP20 contract. You can either use a pre-deployed EIP20 contract or deploy a new one as shown below.

```js
// Deploy EIP20 
if needed (not mandatory)
let erc20Address = null;
deployer.deployERC20Token().then(function( receipt ){
  erc20Address = receipt.contractAddress;
  console.log('erc20Address noted down:', erc20Address);
});
```

#### Economy setup

###### Deploying the TokenRules contract

One TokenRules contract is deployed per Organization. Only the Organization can register rule contracts in the TokenRules contract.

```js
// Deploy TokenRules contract
let tokenRulesAddress = null;
deployer.deployTokenRules(organizationAddress, erc20Address).then(function( receipt ){
  tokenRulesAddress = receipt.contractAddress;
  console.log('tokenRulesAddress noted down:', tokenRulesAddress);
});
```

###### Deploy a rule contract (TransferRule)

OpenST.js comes with a TransferRule contract that transfers EIP20 tokens. We encourage you to deploy and use your own rule contracts.

Here we shall deploy the TransferRule contract. Later, this rule contract will be registered in the TokenRules contract by the Organization.

```js
// Deploy TransferRule contract
let transferRuleAddress = null;

deployer.deploySimpleTransferRule(tokenRulesAddress).then(function( receipt ){
  transferRuleAddress = receipt.contractAddress;
  console.log('transferRuleAddress noted down:', transferRuleAddress);
});
```

###### Register token rule using `openST.contracts.TokenRules`

```js

let tokenRules = new openST.contracts.TokenRules(tokenRulesAddress);
let ruleName = 'transferFrom1';
let ruleAbi = JSON.stringify( openST.abiBinProvider().getABI('TransferRule') );
tokenRules.registerRule(ruleName, transferRuleAddress, ruleAbi).send({
    from: organizationAddress,
    gasPrice: gasPrice,
    gas: gas
}).then( function ( receipt ) {
  console.log("receipt", JSON.stringify(receipt, null, 2) );
  if ( receipt.status ) {
    console.log(ruleName, ' registered successfully');  
  } else {
    console.error(ruleName, ' failed to register.');  
  }
});
```

###### OpenST Contracts

`openST.contracts` exposes TokenHolder and TokenRules contracts interact classes.

These contract interact objects are similar to [web3.eth.Contracts.methods](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#id12).

#### User setup

###### Deploying a TokenHolder contract

One TokenHolder contract is deployed per user. The TokenHolder contract holds tokens for the user.

```js
let wallets = [wallet1, wallet2];
let requirement = wallets.length;
let tokenHolderAddress = null;

// Deploy TokenHolder contract
deployer.deployTokenHolder(




Address, tokenRulesAddress, requirement, wallets).then(function(receipt){
  tokenHolderAddress = receipt.contractAddress;
  console.log('tokenHolderAddress noted down:', tokenHolderAddress);
});
```

###### Create ephemeral key for TokenHolder contract (optional)

```js

  // Create a new ephemeral key
  let ephemeralKeyAccount = openST.web3().eth.accounts.create();
  let ephemeralKeyAddress = ephemeralKeyAccount.address;
```

###### Authorize session keys in TokenHolder

Using the TokenHolder's authorize session function, owners can register an ephemeral key. Authorize session is a multi-sig operation.

```js
// Create an instance of TokenHolder contract interact
let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

// Authorize ephemeral key
let authorizeSession = async function(openST, tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await openST.web3().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);

  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

  let len = wallets.length - 1;

  let currWallet = wallets[len];

  console.log('* submitAuthorizeSession from wallet:', currWallet);
  // Authorize an ephemeral key
  let submitAuthorizeSessionReceipt = await tokenHolder
    .submitAuthorizeSession(ephemeralKey, spendingLimit, expirationHeight)
    .send({
      from: currWallet,
      gasPrice: gasPrice,
      gas: gas
    });

  console.log("submitAuthorizeSessionReceipt", JSON.stringify(submitAuthorizeSessionReceipt, null, 2));
  if ( !submitAuthorizeSessionReceipt.status ) {
    console.log("SubmitAuthorizeSession failed.");
    return Promise.reject('SubmitAuthorizeSession failed.');
  }

  console.log('SessionAuthorizationSubmitted Event', JSON.stringify(submitAuthorizeSessionReceipt.events.SessionAuthorizationSubmitted, null, 2));

  let transactionId = submitAuthorizeSessionReceipt.events.SessionAuthorizationSubmitted.returnValues._transactionId;

  while (len--) {
    let currWallet = wallets[len];

    console.log('* confirmTransaction from wallet:', currWallet);

    // Authorize an ephemeral key
    let confirmTransactionReceipt = await tokenHolder.confirmTransaction(transactionId).send({
      from: currWallet,
      gasPrice: gasPrice,
      gas: gas
    });

    if (!confirmTransactionReceipt.events.TransactionConfirmed) {
      console.log('Failed to confirm transaction', JSON.stringify(confirmTransactionReceipt, null, 2));
      return Promise.reject('Failed to confirm transaction');
    }
  }

  let ephemeralKeysResponse = await tokenHolder.ephemeralKeys(ephemeralKey).call({});
  console.log('ephemeralKeysResponse', ephemeralKeysResponse);

  if (ephemeralKeysResponse.status == 1 && ephemeralKeysResponse.expirationHeight > currentBlockNumber) {
    console.log('Ephemeral key with address', ephemeralKey, 'has been successfully authorized');
  } else {
    console.log('Failed to authorize Ephemeral key with address', ephemeralKey);
  }

  return ephemeralKeysResponse;
};
authorizeSession(openST, tokenHolderAddress, ephemeralKeyAddress, wallets);
```

###### Fund EIP20 tokens

The TokenHolder contract address must be funded with tokens for the transfer rule to be executed.

```js
// Fund the tokenHolderAddress with EIP20 tokens
// If you are using MockToken, the following method can help you
let fundERC20Tokens = async function() {
  const BigNumber = require('bignumber.js');
  let amountToTransfer = new BigNumber('1000000000000000000000');

  console.log('Funding ERC20 tokens to token holder:', tokenHolderAddress);

  let mockToken = new (openST.web3()).eth.Contract(mockTokenAbi, erc20Address);

  mockToken.methods
    .transfer(tokenHolderAddress, amountToTransfer.toString(10))
    .send({
      from: deployerAddress,
      gasPrice: gasPrice,
      gas: gas
    });
};
fundERC20Tokens().then(function(r) {
  console.log('Fund ERC20 DONE!', r);
});
```

#### Balance verification: Before execute rule

```js
let checkBalance = async function (address) {

  let mockToken = new (openST.web3()).eth.Contract(mockTokenAbi, erc20Address);
  return mockToken.methods.balanceOf(address).call({});
};

let beforeBalance = null;
checkBalance(tokenHolderAddress).then(function (r) {
  beforeBalance = r;
  console.log('beforeBalance noted down:', beforeBalance);
});
```

#### Execute sample rule

Here, the executable transaction is signed by an ephemeral key. The facilitator calls the TokenHolder's execute rule method to execute a function in the rule contract.

The TokenHolder approves the TokenRules to transfer some if its tokens. Transfers are performed by the TokenRules contract.

```js
let executeSampleRule = async function(tokenRulesContractAddress, tokenHolderContractAddress, ephemeralKeyAccount) {
  const BigNumber = require('bignumber.js');
  let ephemeralKey = ephemeralKeyAccount.address;

  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderContractAddress),
    amountToTransfer = new BigNumber(100);

  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);
  let transferRule = await tokenRules.getRule(ruleName);

  let ruleContractAddress = transferRule.options.address;

  console.log('** Fetching ephemeral key nonce from token holder contract.');
  let keyNonce = await tokenHolder
    .ephemeralKeys(ephemeralKey)
    .call({})
    .then((ephemeralKeyData) => {
      let nonceBigNumber = new BigNumber(ephemeralKeyData[1]);
      return nonceBigNumber.toString(10);
    });

  console.log('** Constructing the data to sign by the ephemeral key.');
  let methodEncodedAbi = await transferRule.methods
    .transferFrom(
      tokenHolderContractAddress,
      '0x66d0be510f3cac64f30eea359bda39717569ea4b',
      amountToTransfer.toString(10)
    )
    .encodeABI();

  console.log('** Fetching call prefix from the token holder contract.');
  let callPrefix = await tokenHolder.EXECUTE_RULE_CALLPREFIX().call({});

  console.log('** Sign the data as per EIP 1077.');
  let eip1077SignedData = ephemeralKeyAccount.signEIP1077Transaction({
    from: tokenHolderContractAddress,
    to: ruleContractAddress,
    value: 0,
    gasPrice: 0,
    gas: 0,
    data: methodEncodedAbi,
    nonce: keyNonce,
    callPrefix: callPrefix
  });

  console.log('** Calling executeRule on tokenHolder contract.');
  let executeRuleResponse = await tokenHolder
    .executeRule(
      ruleContractAddress,
      methodEncodedAbi,
      keyNonce,
      eip1077SignedData.v,
      eip1077SignedData.r,
      eip1077SignedData.s
    )
    .send({
      from: facilitatorAddress,
      gasPrice: gasPrice,
      gas: gas
    });

  if(!executeRuleResponse.events.RuleExecuted) {
    let err = 'RuleExecuted event not obtained.';
    return Promise.reject(err);
  }

  if(!executeRuleResponse.events.RuleExecuted.returnValues._status) {
      let err = 'Rule Executed with status false.';
      return Promise.reject(err);
  }
  console.log('** Rule executed with status true.');
};
executeSampleRule(tokenRulesAddress, tokenHolderAddress, ephemeralKeyAccount);
```

#### Balance verification: After execute rule

```js
let verifyBalance = async function () {
  const BigNumber = require('bignumber.js');

  let afterBalance = await checkBalance(tokenHolderAddress);
  console.log('afterBalance noted down:', afterBalance);

  let beforeBalanceBn = new BigNumber(beforeBalance);
  let afterBalanceBn = new BigNumber(afterBalance);

  if (beforeBalanceBn.minus(afterBalanceBn).toString(10) == '100') {
    console.log('balance change verification DONE!');
  } else {
    console.log('balance change verification FAILED!');
  }
};

verifyBalance();
```
