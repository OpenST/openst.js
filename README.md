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
    
- Language: nodejs   

- Web3 documentation for reference: https://web3js.readthedocs.io/en/1.0/web3-eth.html  
    
- Install openst.js in your project

  npm install https://github.com/OpenSTFoundation/openst.js#setup-mvp --save
  
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

The below command creates a json file (~/openst-setup/config.json) having all the needed addresses and other constants. 
It also starts GETH process for the chain. This is meant for developer to get going directly and try out the functionality 
of openst.js as described in the following sections.

```
> Clone openst.js

    git clone git@github.com:OpenSTFoundation/openst.js.git
    
> Install npm packages
   
  cd openst.js
  git checkout setup-mvp 
  npm install
  
> npm run init-dev-env
```
    
##### Sample Constants

To seemlessly execute the example code provided in this file, please use below code if you have setup development environment using init-dev-env.
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

//Ephemeral Key Address
let ephemeralKey = devEnvConfig.ephemeralKey1;

let facilitatorAddress = devEnvConfig.facilitator;
let passphrase = 'testtest';

// some other constants
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

Optionally, you can set these constants as you wish to.

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

Remember to add all of deployerAddress, organizationAddress, wallet1, wallet2, ephemeralKey and facilitatorAddress to use the functionality given in this readme. In general, add only those accounts which are being used in the transactions in your use cases.

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

##### OpenST Signers Service
OpenST.js makes it easy for developers to build custom and secure key-management solutions.

Thats right! You can build your own custom signer service. Once the signer service is set, you can continue to use Contract.methods.myMethod.send (https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send) & web3.eth.sendTransaction (https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction) without worrying about unlocking/signing the transactions. 

OpenST.js will call your service to determine the nonce of the sender, ask your service to sign the transaction and then submit the transaction. You can set the signer service using `openST.signers.setSignerService` method.

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
gethSigner.addAccount(ephemeralKey, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);

openST.signers.setSignerService(gethSigner);
```

##### Deploying ERC20 contract (Optional)

Optionally, you will want ERC20 contract to be deployed. You can use a pre-deployed ERC20 contract address as well, instead.

```js
// deploy ERC20 - if needed. Not mandatory
let erc20TokenContractAddress = null;

let InitERC20Token = openST.setup.InitERC20Token;
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

TokenRules contract is deployed per organization. Organization needs register custom rules contract in TokenRules contract.

```js
// deploy TokenRules contract
let tokenRulesContractAddress = null;

let InitTokenRules = openST.setup.InitTokenRules;
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

Per user TokenHolder contract is deployed. TokenHolder contract holds Utility tokens of user.

```js
let requirement = 2;
let wallets = [wallet1, wallet2];
let tokenHolderContractAddress = null;

// setting first token holder
console.log('* Deploying Token Holder Contract1');
let InitTokenHolder = openST.setup.InitTokenHolder;
new InitTokenHolder({
  deployerAddress: deployerAddress,
  deployerPassphrase: passphrase,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  args: [
    erc20TokenContractAddress,
    erc20TokenContractAddress, // this will be coGateway contract address. passing dummy value for now.
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

Using TH authorize session function, owners can register an ephemeral key. Authorize session is a multisig operation.
 
```js
let authorizeSession = async function (tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await openST.web3().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);
  
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);
  
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

##### Fund ERC20 tokens

Now we will fund ERC20 tokens to token holder contract address for example execute rule to run.

```js
// Fund ERC20 tokens to the tokenHolderContractAddress
// If you are using the MockToken, following method can help you.
let fundERC20Tokens = async function() {
  const BigNumber = require('bignumber.js');
  let amountToTransfer = new BigNumber('1000000000000000000000');
  
  console.log('Funding ERC20 tokens to token holder:', tokenHolderContractAddress);
  
  let mockToken = new (openST.web3()).eth.Contract(mockTokenAbi, erc20TokenContractAddress);
  
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

Here we are deploying custom rules contract. The rules contract is registered inside TokenRules contract by organization.

```js
// deploy rule contract
let ruleContractAddress = null;

let InitRule = openST.setup.InitTransferRule;
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

##### Register rule

Here organization is registering rules contract in TokenRules. TokenHolder execute rule can called for whitelisted rules contract only.

```js
// register rule
let registerRule = async function (ruleName, ruleContractAddress) {
  
  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);
  
  return tokenRules.registerRule(ruleName, ruleContractAddress)
    .send({
      from: organizationAddress,
      gasPrice: gasPrice,
      gas: gasLimit
    })
};
registerRule('transferFrom', ruleContractAddress).then(console.log);
```

##### Execute sample rule

Here executable transaction is signed by ephemeral key. Facilitator calls TokenHolder execute rule method to execute custom rule.
TokenHolder approves Token rules for transfer. Transfers are done in TokenRules contract.

```js
let executeSampleRule = async function(tokenHolderAddress, ephemeralKey) {
  const BigNumber = require('bignumber.js');
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress),
    amountToTransfer = new BigNumber(100);
  
  let transferRuleAbi = parseFile('./contracts/abi/TransferRule.abi', 'utf8');
  let transferRule = new (openST.web3()).eth.Contract(transferRuleAbi, ruleContractAddress);
    
  let methodEncodedAbi = await transferRule.methods
    .transferFrom(
      tokenHolderAddress,
      '0x66d0be510f3cac64f30eea359bda39717569ea4b',
      amountToTransfer.toString(10)
    ).encodeABI();
  
  let executableTransactionObject = new openST.utils.ExecutableTransaction({
    web3: openST.web3(),
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
  
  let mockToken = new (openST.web3()).eth.Contract(mockTokenAbi, erc20TokenContractAddress);
  return mockToken.methods.balanceOf(address).call({});
};
checkBalance(tokenHolderContractAddress).then(console.log)
```

