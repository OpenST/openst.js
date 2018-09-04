# openst.js

OpenST is a framework for building token economies. In here, we will go through a sample usage of OpenST.

```js
// Creating object of web3 js using the GETH endpoint
const Web3 = require('web3');
const gethEndpoint = 'http://127.0.0.1:8545';
let web3Provider = new Web3(gethEndpoint);

// Creating object of OpenST
const OpenST = require('./index.js');
let openST = new OpenST(web3Provider);

const ephemeralKey = '0x78c0a912cecbacf92d8f41fd8818f812109094d8';
const wallet = '0x874ed94a8f564fa6071072ad431569d3ebfa914c';
const facilitator = '0x6984a72fa02330d14c03ed3df0b8d4130ea80ea0';
const organizationAddress = '0xe2457e48c658317c78d97fe4dbe6d3746c435763';



const tokenHolderAddress = '0x729CC130c8A146c621330035B4D8F6BFABe52204';
const tokenHolder2Address = '0x44052188e1685Ef06a3315818FE8D8B2cC9529Dc';
const tokenRulesContractAddress = '0x599d9A845C46761ecb9E17E74B266393Cc90B675';
const transferRuleContractAddress = '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c';

const spendingLimit = '10000000000000000000000000000';
const expirationHeight = '10000000000000000000000000000';
const passphrase = 'testtest';
const gasPrice = '0x12A05F200';
const actionName = 'transferFrom';
const ruleName = 'transferFrom';

// Helper function for reading json file
const fs = require('fs');
function parseFile(filePath, options) {
  filePath = path.join(filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

// Creating the interface for TokenHolder Contract
let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

// authorise session
web3Provider.eth.personal.unlockAccount(wallet, passphrase).then(async function () {
 let r = await tokenHolder.authorizeSession(ephemeralKey, spendingLimit, expirationHeight).send({
   from: wallet,
   gasPrice: gasPrice
 });
 console.log(r);
 return r;
});

// Creating the interface for TokenRules Contract
let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);

// register rule
web3Provider.eth.personal.unlockAccount(organizationAddress, passphrase).then(async function () {
 let r = await tokenRules.registerRule(ruleName, transferRuleContractAddress).send({
   from: organizationAddress,
   gasPrice: gasPrice
 });
 console.log(r); 
 return r;
});

// Helper method for getting the execute rule params.
getExecuteRuleParams = async function (
    web3Provider,
    tokenRules,
    ruleName,
    methodName,
    ruleAbi,
    tokenHolderAddress,
    ruleMethodArgs
  ) {
  const BigNumber = require('bignumber.js');
  
  // let ruleInfoFromTokenRules = await tokenRules.ruleByName(ruleName).call({});
  // let ruleContractAddress = ruleInfoFromTokenRules.contractAddress;
  
  // this is temporary. Need to remove this when Pro adds the rule by name map.
  let ruleContractAddress = transferRuleContractAddress;
  
  let ruleContract = new web3Provider.eth.Contract(ruleAbi, ruleContractAddress);
  
  let ephemeralKey1Data = await tokenHolder.ephemeralKeys(ephemeralKey).call({});
  
  let bigNumberNonce = new BigNumber(ephemeralKey1Data[1]),
    ephemeralKeyNonce = bigNumberNonce.add(1).toString(10);
  
  let executableData = await ruleContract.methods[methodName].apply(ruleContract, ruleMethodArgs).encodeABI();
  
  // Get 0x + first 8(4 bytes) characters
  let callPrefix = executableData.substring(0, 10);
  
  let messageToBeSigned = await web3Provider.utils.soliditySha3(
    { t: 'bytes', v: '0x19' }, // prefix
    { t: 'bytes', v: '0x00' }, // version control
    { t: 'address', v: tokenHolderAddress },
    { t: 'address', v: ruleContractAddress},
    { t: 'uint8', v: '0' },
    { t: 'bytes', v: executableData },
    { t: 'uint256', v: ephemeralKeyNonce }, // nonce
    { t: 'uint8', v: '0' },
    { t: 'uint8', v: '0' },
    { t: 'uint8', v: '0' },
    { t: 'bytes', v: callPrefix },
    { t: 'uint8', v: '0' },
    { t: 'bytes', v: '0x' }
  );
        
  await web3Provider.eth.personal.unlockAccount(ephemeralKey, passphrase);
  let signature = await web3Provider.eth.sign(messageToBeSigned, ephemeralKey);
  signature = signature.slice(2);
  
  let r = '0x' + signature.slice(0, 64),
    s = '0x' + signature.slice(64, 128),
    v = web3Provider.utils.toDecimal('0x' + signature.slice(128, 130)) + 27;
  
  return [
    tokenHolderAddress,
    ruleContractAddress,
    ephemeralKeyNonce,
    executableData,
    callPrefix,
    v,
    r,
    s
  ];
};

const transferRuleJsonInterface = parseFile('./contracts/abi/TransferRule.abi', 'utf8');

// execute the rule
getExecuteRuleParams(
  web3Provider,
  tokenRules,
  ruleName,
  actionName,
  transferRuleJsonInterface,
  tokenHolderAddress,
  [tokenHolderAddress, tokenHolder2Address, '100']).then(
    async function(executeRuleParams) {
      await web3Provider.eth.personal.unlockAccount(facilitator, passphrase);
      
      let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);
      let executeRuleReceipt = await tokenHolder.executeRule.apply(tokenHolder, executeRuleParams).send(
        {from: facilitator, gasPrice: gasPrice});
      
      console.log('executeRuleReceipt:', JSON.stringify(executeRuleReceipt));
      
      return executeRuleReceipt;
    });
```