/**
 * Sample Rule Execute
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert,
  fs = require('fs');

const config = require('../test/utils/configReader'),
  abis = require('../test/utils/abis'),
  Web3WalletHelper = require('../test/utils/Web3WalletHelper');

let openST,
  deployParams,
  erc20TokenContractAddress,
  tokenRulesContractAddress,
  tokenHolderContractAddress,
  sampleCustomRuleContractAddress,
  ephemeralKeyAccount;

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
  let submitAuthorizeSession1Response = await tokenHolder
    .submitAuthorizeSession(ephemeralKey, spendingLimit, expirationHeight)
    .send({
      from: currWallet,
      gasPrice: config.gasPrice,
      gas: config.gasLimit
    });

  assert.isOk(
    submitAuthorizeSession1Response.events.SessionAuthorizationSubmitted,
    'SessionAuthorizationSubmitted event not obtained.'
  );

  console.log('** SessionAuthorizationSubmitted event obtained.');

  assert.isOk(submitAuthorizeSession1Response.events.TransactionConfirmed, 'TransactionConfirmed event not obtained.');

  console.log('** TransactionConfirmed event obtained.');

  let transactionId = submitAuthorizeSession1Response.events.SessionAuthorizationSubmitted.returnValues._transactionId;

  console.log('transactionId:', transactionId);

  while (len--) {
    let currWallet = wallets[len];

    console.log('* confirmTransaction from wallet:', currWallet);

    // Authorize an ephemeral public key
    let confirmTransactionResponse = await tokenHolder.confirmTransaction(transactionId).send({
      from: currWallet,
      gasPrice: config.gasPrice,
      gas: config.gasLimit
    });

    assert.isOk(confirmTransactionResponse.events.TransactionConfirmed, 'TransactionConfirmed event not obtained.');

    console.log('** TransactionConfirmed event obtained.');
  }

  let isEphemeralKeyActiveResponse = await tokenHolder.isEphemeralKeyActive(ephemeralKey).call({});

  assert.isTrue(isEphemeralKeyActiveResponse, 'isEphemeralKeyActive response not true');
  console.log('** Ephemeral key', ephemeralKey, 'is active.');
};

let fundERC20Tokens = async function(openST, erc20TokenContractAddress, tokenHolderContractAddress) {
  const BigNumber = require('bignumber.js');
  let amountToTransfer = new BigNumber('1000000000000000000000');

  console.log('Funding ERC20 tokens to token holder:', tokenHolderContractAddress);

  let mockToken = new (openST.web3()).eth.Contract(abis.mockToken, erc20TokenContractAddress);

  return mockToken.methods.transfer(tokenHolderContractAddress, amountToTransfer.toString(10)).send({
    from: config.deployerAddress,
    gasPrice: config.gasPrice,
    gas: config.gasLimit
  });
};

let registerRule = async function(openST, tokenRulesContractAddress, ruleName, ruleContractAddress, ruleAbi) {
  ruleAbi = ruleAbi || 'a';

  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);

  console.log('* registerRule with _ruleName:', ruleName, '_ruleAddress:', ruleContractAddress, '_ruleAbi:', ruleAbi);

  let registerRuleResponse = await tokenRules.registerRule(ruleName, ruleContractAddress, ruleAbi).send({
    from: config.organizationAddress,
    gasPrice: config.gasPrice,
    gas: config.gasLimit
  });

  assert.isOk(registerRuleResponse.events.RuleRegistered, 'RuleRegistered event not obtained.');

  console.log('** RuleRegistered event obtained.');
};

let executeSampleRule = async function(
  openST,
  ruleContractAddress,
  tokenHolderAddress,
  ephemeralKeyAccount,
  ephemeralKey,
  ephemeralKeyPrivateKey
) {
  const BigNumber = require('bignumber.js');
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress),
    amountToTransfer = new BigNumber(100);

  let transferRuleAbi = abis.sampleCustomRule;
  let transferRule = new (openST.web3()).eth.Contract(transferRuleAbi, ruleContractAddress);

  // TODO:: transferRule obj to be prepared in a different way
  let methodEncodedAbi = await transferRule.methods
    .transferFrom(tokenHolderAddress, '0x66d0be510f3cac64f30eea359bda39717569ea4b', amountToTransfer.toString(10))
    .encodeABI();

  let executableTransactionObject = new openST.utils.ExecutableTransaction({
    web3: openST.web3(),
    tokenHolderContractAddress: tokenHolderAddress,
    ruleContractAddress: ruleContractAddress,
    methodEncodedAbi: methodEncodedAbi,
    ephemeralKeyAddress: ephemeralKey,
    tokenHolderInstance: tokenHolder
  });

  let keyNonce = await executableTransactionObject.getNonce();
  console.log('keyNonce', keyNonce);

  let web3 = openST.web3();
  let callPrefix = await tokenHolder.EXECUTE_RULE_CALLPREFIX().call({});

  console.log('testcase callPrefix', callPrefix);
  let eip1077SignedData = ephemeralKeyAccount.signEIP1077Transaction({
    from: tokenHolderAddress,
    to: ruleContractAddress,
    value: 0,
    gasPrice: 0,
    gas: 0,
    data: methodEncodedAbi,
    nonce: keyNonce,
    callPrefix: callPrefix
  });
  console.log('eip1077SignedData (ephemeralKeyAccount.signEIP1077Transaction)', eip1077SignedData);

  //Sign the data and put it in executableTransactionData.
  // let executableTransactionData =

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
      from: config.facilitatorAddress,
      gasPrice: config.gasPrice,
      gas: config.gasLimit
    });

  console.log('executeRuleResponse\n', JSON.stringify(executeRuleResponse, null, 2));
  // TODO - assert for event received
  return;
};

let checkBalance = async function(openST, erc20TokenContractAddress, address) {
  let mockToken = new (openST.web3()).eth.Contract(abis.mockToken, erc20TokenContractAddress);
  return mockToken.methods.balanceOf(address).call({});
};

// Load cache service
describe('test/sampleRuleExecute', function() {
  before(async function() {
    // Creating object of OpenST
    const OpenST = require('../index.js');
    openST = new OpenST(config.gethRpcEndPoint);

    deployParams = {
      deployerAddress: config.deployerAddress,
      deployerPassphrase: config.passphrase,
      gasPrice: config.gasPrice,
      gasLimit: config.gasLimit
    };

    // adding the addresses to the web3 wallet
    let web3WalletHelper = new Web3WalletHelper(openST.web3());
    await web3WalletHelper.init();

    let setup = new openST.Setup(deployParams);
    // deploy ERC20
    console.log('* Deploying ERC20 Token');
    let erc20DeployReceipt = await setup.deployERC20Token();
    erc20TokenContractAddress = erc20DeployReceipt.contractAddress;

    // deploy TokenRules
    console.log('* Deploying TokenRules');
    let tokenRulesDeployReceipt = await setup.deployTokenRules(config.organizationAddress, erc20TokenContractAddress);
    tokenRulesContractAddress = tokenRulesDeployReceipt.contractAddress;

    // deploy TokenHolder
    let wallets = [config.wallet1, config.wallet2];
    let requirement = wallets.length;

    console.log('* Deploying Token Holder Contract');
    let tokenHolderDeployReceipt = await setup.deployTokenHolder(
      erc20TokenContractAddress,
      tokenRulesContractAddress,
      requirement,
      wallets
    );
    tokenHolderContractAddress = tokenHolderDeployReceipt.contractAddress;

    // create a ephemeralKey
    ephemeralKeyAccount = openST.web3().eth.accounts.create();

    await authorizeSession(openST, tokenHolderContractAddress, ephemeralKeyAccount.address, wallets);

    console.log('* Funding ERC20 tokens from deployer address');
    await fundERC20Tokens(openST, erc20TokenContractAddress, tokenHolderContractAddress);

    console.log('* Deploying Sample Custom Rule');
    let sampleCustomRuleDeployReceipt = await setup.deploySampleCustomRule(tokenRulesContractAddress);
    sampleCustomRuleContractAddress = sampleCustomRuleDeployReceipt.contractAddress;

    console.log('* Registering Sample Custom Rule');
    await registerRule(openST, tokenRulesContractAddress, 'transferFrom', sampleCustomRuleContractAddress);
  });

  it('Execute Sample Custom Rule', async function() {
    let beforeBalance = await checkBalance(openST, erc20TokenContractAddress, tokenHolderContractAddress);

    console.log('* Execute Sample Custom Rule');
    await executeSampleRule(
      openST,
      sampleCustomRuleContractAddress,
      tokenHolderContractAddress,
      ephemeralKeyAccount,
      ephemeralKeyAccount.address,
      ephemeralKeyAccount.privateKey
    );

    let afterBalance = await checkBalance(openST, erc20TokenContractAddress, tokenHolderContractAddress);

    const BigNumber = require('bignumber.js');
    let beforeBalanceBn = new BigNumber(beforeBalance);
    let afterBalanceBn = new BigNumber(afterBalance);

    assert.equal(beforeBalanceBn.minus(afterBalanceBn).toString(10), '100');
  });
});
