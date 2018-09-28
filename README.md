# openst.js

OpenST is a framework for building token economies. Here, we will go through a sample usage of OpenST. 

Below is overview of different components and their roles:

- One Economy will have one TokenRules Contract deployed on it.
  TokenRules Contract keeps a list of all the registered Custom Rules Contracts with their properties and helps in interacting with them.
  
- Each user in a token economy internally will be represented by a contract address. This contract is Token Holder contract. 
  Token Holder contract will hold user’s tokens. It’s a multisig contract. This means a Token Holder can have multiple owners.
  
- Each partner company will write at least one Custom Rules Contract. They can write multiple based on requirement / economy design.
  Each economy has actions and the logic around these actions will be defined as rules in this contract. 

##### Install all the dependent packages
```
> sudo apt-get update
  sudo apt-get install nodejs
  sudo apt-get install npm
  sudo apt-get install software-properties-common
```

##### Prerequisite

- Web3 documentation for reference: https://web3js.readthedocs.io/en/1.0/web3-eth.html  
    
- Install openst.js in your project

  npm install https://github.com/OpenSTFoundation/openst.js#develop --save
  
- Geth Installation on mac machine  

    Below code tested with geth version: 1.7.3-stable. However any higher version of geth should also work. 
    
    curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.3-4bb3c89d.tar.gz | tar xvz
    mv geth-linux-amd64-1.7.3-4bb3c89d /usr/local/bin
    ln -s /usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d/geth /usr/local/bin/geth
    export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d"
    
- Make sure your development machine is synced with a any of below test environments. 

  https://ropsten.etherscan.io/
  https://kovan.etherscan.io/
  https://rinkeby.etherscan.io/  
 

- Below addresses should already be created in the test environment and funded with gas.
 
    deployerAddress - address which deploy ERC20Token, TokenRules, TokenHolder, Custom Rules contracts 
    organizationAddress - Address which will register custome rules contract to TokenRules
    wallet1 - Owner1 of TokenHolder contract.
    wallet2 - Owner2 of TokenHolder contract.
    ephemeralKey - Key which will be authorized by owners in TokenHolder contract. This key will sign execute custom rule transactions.
    facilitatorAddress - Address which will facilitate custom rule transactions.

##### Initializing chain on developer machines for development testing

The below command creates a json file (`~/openst-setup/config.json`) having all the needed addresses and other constants. 
It also starts GETH process for the chain. This is meant for developer to get going directly and try out the functionality 
of openst.js as described in the following sections.


###### Clone openst.js
```
git clone git@github.com:OpenSTFoundation/openst.js.git
``` 
###### Install npm packages
```   
cd openst.js
git checkout develop
npm install
```
###### Setup Development Environment
```
node ./tools/initDevEnv.js ~
```
    
##### Sample Constants
To seemlessly execute the example code provided in this file, please use below code if you have setup development environment using init-dev-env.

```js
const os = require('os');
let configFilePath = os.homedir() + '/openst-setup/config.json';
let devEnvConfig = require(configFilePath);

// Deployer address
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

// Helper function for reading json file
const fs = require('fs');
 function parseFile(filePath, options) {
 filePath = path.join(filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
 }
  
let mockTokenAbi = parseFile('./contracts/abi/MockToken.abi', 'utf8');


```

Optionally, you can set these constants as you wish to.

```js

// Deployer address
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

// Helper function for reading json file
const fs = require('fs');
 function parseFile(filePath, options) {
 filePath = path.join(filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
 }
  
let mockTokenAbi = parseFile('./contracts/abi/MockToken.abi', 'utf8');


```

##### Creating an object of OpenST

```js
// Creating object of web3 js using the GETH endpoint
const gethEndpoint = 'http://127.0.0.1:8545';

// Creating object of OpenST
const OpenST = require('./index.js');
let openST = new OpenST(gethEndpoint);


```

### Adding accounts
One can add accounts to web3 wallet or to our custom signer service. You should do only one of these and not both.

Remember to add each of deployerAddress, organizationAddress, wallet1, wallet2, ephemeralKey and facilitatorAddress to use the functionality given in this readme. In general, add only those accounts which are being used in the transactions in your use cases.

##### Add accounts to web3 wallet
For adding to web3 wallet, there are 2 ways. We can add using the keystore file OR by private key.
In detail documentation can be found here - https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html
```js

// fetch the web3 object to add to the wallet.
// add all your accounts to this openST web3 object.
let web3 = openST.web3();

// Here is a sample helper method for the developers to add account to wallet using keystore content.
// Read more about web3.eth.accounts.decrypt here: https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#id22
let addToWalletByKeystoreContent = function (encryptedPrivateKey, password) {
  let account = web3.eth.accounts.decrypt(encryptedPrivateKey, password);
  web3.eth.accounts.wallet.add(account);
};


```

#### OpenST Signers Service
OpenST.js makes it easy for developers to build custom and secure key-management solutions.

Thats right! You can build your own custom signer service. Once the signer service is set, you can continue to use Contract.methods.myMethod.send (https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send) & web3.eth.sendTransaction (https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction) without worrying about unlocking/signing the transactions. You can set the signer service using `openST.signers.setSignerService` method.

OpenST.js will call your service to determine the nonce of the sender, ask your service to sign the transaction and then submit the transaction. 

All you need to do is provide the instance of openST with an object that exposes three functions:
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

  // signTransaction - method to provide openSt with signed raw transaction.
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

openst.js comes with a sample geth signer service that you can use for development purpose.

```js
let gethSigner = new openST.utils.GethSignerService(openST.web3());

gethSigner.addAccount(deployerAddress, passphrase);
gethSigner.addAccount(organizationAddress, passphrase);
gethSigner.addAccount(wallet1, passphrase);
gethSigner.addAccount(wallet2, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);

openST.signers.setSignerService(gethSigner);


```

#### OpenST Deployer
openst.js comes with Deployer Class that can deploy TokenRules, TokenHolder, TransferRule (Sample Rule), ERC20 Token (Mock ERC20 Token).
```js
let deployerParams = {
  "from": deployerAddress,
  "gasPrice": gasPrice,
  "gas": gas
};
let deployer = new openST.Deployer( deployerParams );


```


##### Deploying ERC20 Contract (Optional)

Optionally, you will want ERC20 contract to be deployed. You can use a pre-deployed ERC20 contract address as well, instead.

```js
// Deploy ERC20 - if needed. Not mandatory
let erc20Address = null;
deployer.deployERC20Token().then(function( receipt ){
  erc20Address = receipt.contractAddress;
  console.log('erc20Address noted down:', erc20Address);
});


```

##### Deploying TokenRules Contract

TokenRules contract is deployed per organization. Organization needs register custom rules contract in TokenRules contract.

```js
// Deploy TokenRules contract
let tokenRulesAddress = null;
deployer.deployTokenRules(organizationAddress, erc20Address).then(function( receipt ){
  tokenRulesAddress = receipt.contractAddress;
  console.log('tokenRulesAddress noted down:', tokenRulesAddress);
});


```

##### Deploying TokenHolder Contract

Per user TokenHolder contract is deployed. TokenHolder contract holds Utility tokens of user.

```js
let wallets = [wallet1, wallet2];
let requirement = wallets.length;
let tokenHolderAddress = null;

// Deploy TokenHolder Contract
deployer.deployTokenHolder(erc20Address, tokenRulesAddress, requirement, wallets).then(function(receipt){
  tokenHolderAddress = receipt.contractAddress;
  console.log('tokenHolderAddress noted down:', tokenHolderAddress);
});


```

##### Deploy Rule Contract (A Simple Transfer Rule)
openst.js comes with a Simple Transfer Rule Contract that tranfers ERC20 Tokens using the OpenST protocol.
We encorage you to deploy and use your own Custom Token Economy Rule.
Here we shall deploye the Transfer Rule contract. 
Later, this rule contract will be registered in TokenRules contract by the organization.

```js
// Deploy Transfer Rule Contract
let transferRuleAddress = null;

deployer.deploySimpleTransferRule(tokenRulesAddress).then(function( receipt ){
  transferRuleAddress = receipt.contractAddress;
  console.log('transferRuleAddress noted down:', transferRuleAddress);
});


```

#### OpenST Contracts
`openSt.contracts` exposes TokenHolder and TokenRules contract interact classes.
These contract interacts object are similar to [web3.eth.Contracts.methods](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#id12). 

##### Register Token Economy Rule using `openST.contracts.TokenRules`

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

##### Create Ephemeral Key for TokenHolder Contract (Optional)
```js


  // Create a ephemeralKey new Ephemeral Key Account
  let ephemeralKeyAccount = openST.web3().eth.accounts.create();
  let ephemeralKeyAddress = ephemeralKeyAccount.address;


```

##### Authorize session keys in TokenHolder

Using TH authorize session function, owners can register an ephemeral key. Authorize session is a multisig operation.
 
```js

//Create an instance of TokenHolder contract interact.
let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

//Authorize ephemeral key.
let authorizeSession = async function(openST, tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await openST.web3().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);

  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

  let len = wallets.length - 1;

  let currWallet = wallets[len];

  console.log('* submitAuthorizeSession from wallet:', currWallet);
  // Authorize an ephemeral public key
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

    // Authorize an ephemeral public key
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

##### Fund ERC20 tokens

Now we will fund ERC20 tokens to token holder contract address for example execute rule to run.

```js
// Fund ERC20 tokens to the tokenHolderAddress
// If you are using the MockToken, following method can help you.
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

##### Balance verification after execute rule

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

##### Execute sample rule

Here executable transaction is signed by ephemeral key. Facilitator calls TokenHolder execute rule method to execute custom rule.
TokenHolder approves Token rules for transfer. Transfers are done in TokenRules contract.

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

##### Balance verification after execute rule

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

