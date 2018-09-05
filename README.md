# openst.js

OpenST is a framework for building token economies. In here, we will go through a sample usage of OpenST.

##### Install all the dependent packages
```
> npm install
```

##### Initializing chain on developer machines
The below command creates a json file (~/openst-setup/config.json) having all the needed addresses and other constants. 
It also starts GETH process for the chain. This is meant for developer to get going directly and try out the functionality 
of openst.js as described in the following sections.

```
> npm run init-dev-env
```

##### Sample Constants
For running functionality of openst.js, following constants are needed. For developer machines, which were set up in 
the previous section, one can find values of these in ~/openst-setup/config.json file.
```js
// deployer address
const deployerAddress = '0xc786cf11c514762ae6cb02dcd7e77500076ec9a0';

// organization address
const organizationAddress = '0x9d717daa2efbeeaca383ffeda2c65baf31b6ad59';

// wallet addresses
const wallet1 = '0xfa21246b49146fa2b34d8c9dbcb36c944da5194f';
const wallet2 = '0x857962440f978d94225aa06309045f2c4d1da943';

const ephemeralKey = '0x8aef49773419525b667b98120e141b205ccc3ba1';

const facilitatorAddress = '0x18f57cfc1ce9ec053500314a483ea70a27f6824e';

// some other constants
const passphrase = 'testtest';
const gasPrice = '0x12A05F200';
const gasLimit = 4700000;
```

##### Creating an object of OpenST
```js
// Creating object of web3 js using the GETH endpoint
const gethEndpoint = 'http://127.0.0.1:8545';

// Creating object of OpenST
const OpenST = require('./index.js');
let openST = new OpenST(gethEndpoint);
```

##### Add signer
```js
let gethSigner = new openST.utils.GethSignerService(openST.web3Provider());

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
```js
let authorizeSession = async function (tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await openST.web3Provider().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);
  
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);
  
  await openST.web3Provider().eth.personal.unlockAccount(wallets[0], passphrase);
  
  // Authorize an ephemeral public key
  let authorizeSession1Response = await tokenHolder
    .authorizeSession(ephemeralKey, spendingLimit, expirationHeight)
    .send({
      from: wallets[0],
      gasPrice: gasPrice,
      gas: gasLimit
    });
  
  console.log('authorizeSession1Response:', JSON.stringify(authorizeSession1Response, null));
  
  await openST.web3Provider().eth.personal.unlockAccount(wallets[1], passphrase);
  
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
  
  // Helper function for reading json file
  const fs = require('fs');
  function parseFile(filePath, options) {
    filePath = path.join(filePath);
    const fileContent = fs.readFileSync(filePath, options || 'utf8');
    return JSON.parse(fileContent);
  }
  
  let mockTokenAbi = parseFile('./contracts/abi/MockToken.abi', 'utf8');
  let mockToken = new (openST.web3Provider()).eth.Contract(mockTokenAbi, erc20TokenContractAddress);
  
  await (openST.web3Provider()).eth.personal.unlockAccount(deployerAddress, passphrase);
  
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
```js
// register rule
let registerRule = async function (ruleName, ruleContractAddress) {
  await openST.web3Provider().eth.personal.unlockAccount(organizationAddress, passphrase);
  
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
```js
let executeSampleRule = async function(tokenHolderAddress, ephemeralKey) {
  const BigNumber = require('bignumber.js');
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress),
    amountToTransfer = new BigNumber(100);

  // Helper function for reading json file
  const fs = require('fs');
  function parseFile(filePath, options) {
      filePath = path.join(filePath);
      const fileContent = fs.readFileSync(filePath, options || 'utf8');
      return JSON.parse(fileContent);
  }
  
  let transferRuleAbi = parseFile('./contracts/abi/TransferRule.abi', 'utf8');
  let transferRule = new (openST.web3Provider()).eth.Contract(transferRuleAbi, ruleContractAddress);
    
  let methodEncodedAbi = await transferRule.methods
    .transferFrom(
      tokenHolderAddress,
      '0x66d0be510f3cac64f30eea359bda39717569ea4b',
      amountToTransfer.toString(10)
    ).encodeABI();
  
    let executableTransactionObject = new openST.utils.ExecutableTransaction({
        web3Provider: openST.web3Provider(),
        tokenHolderContractAddress: tokenHolderAddress,
        ruleContractAddress: ruleContractAddress,
        methodEncodedAbi: methodEncodedAbi,
        signer: ephemeralKey,
        signerPassphrase: passphrase,
        tokenHolderInstance: tokenHolder
    });
    let executableTransactionData = await executableTransactionObject.get();
    
  await openST.web3Provider().eth.personal.unlockAccount(facilitatorAddress, passphrase);
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



Confirm the change in balance.
