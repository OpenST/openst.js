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
  sampleCustomRuleContractAddress;

let authorizeSession = async function(openST, tokenHolderAddress, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  let currentBlockNumber = await openST.web3().eth.getBlockNumber(),
    spendingLimit = new BigNumber('10000000000000000000000000000').toString(10),
    expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);

  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress);

  let len = wallets.length;

  while (len--) {
    let currWallet = wallets[len];

    // Authorize an ephemeral public key
    let authorizeSession1Response = await tokenHolder
      .authorizeSession(ephemeralKey, spendingLimit, expirationHeight)
      .send({
        from: currWallet,
        gasPrice: config.gasPrice,
        gas: config.gasLimit
      });

    console.log(
      'authorizeSession: {from: ',
      currWallet,
      ', response: ',
      JSON.stringify(authorizeSession1Response, null),
      '}'
    );
  }

  let isAuthorizedEphemeralKeyResponse = await tokenHolder.isAuthorizedEphemeralKey(ephemeralKey).call({});

  console.log('isAuthorizedEphemeralKey:', isAuthorizedEphemeralKeyResponse);
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

let registerRule = async function(openST, tokenRulesContractAddress, ruleName, ruleContractAddress) {
  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);

  return tokenRules.registerRule(ruleName, ruleContractAddress).send({
    from: config.organizationAddress,
    gasPrice: config.gasPrice,
    gas: config.gasLimit
  });
};

let executeSampleRule = async function(openST, ruleContractAddress, tokenHolderAddress, ephemeralKey) {
  const BigNumber = require('bignumber.js');
  let tokenHolder = new openST.contracts.TokenHolder(tokenHolderAddress),
    amountToTransfer = new BigNumber(100);

  let transferRuleAbi = abis.sampleCustomRule;
  let transferRule = new (openST.web3()).eth.Contract(transferRuleAbi, ruleContractAddress);

  let methodEncodedAbi = await transferRule.methods
    .transferFrom(tokenHolderAddress, '0x66d0be510f3cac64f30eea359bda39717569ea4b', amountToTransfer.toString(10))
    .encodeABI();

  let executableTransactionObject = new openST.utils.ExecutableTransaction({
    web3: openST.web3(),
    tokenHolderContractAddress: tokenHolderAddress,
    ruleContractAddress: ruleContractAddress,
    methodEncodedAbi: methodEncodedAbi,
    signer: ephemeralKey,
    signerPassphrase: 'dummy',
    tokenHolderInstance: tokenHolder
  });
  let executableTransactionData = await executableTransactionObject.get();

  return tokenHolder
    .executeRule(
      tokenHolderAddress,
      ruleContractAddress,
      executableTransactionData.ephemeralKeyNonce,
      methodEncodedAbi,
      executableTransactionData.callPrefix,
      executableTransactionData.v,
      executableTransactionData.r,
      executableTransactionData.s
    )
    .send({
      from: config.facilitatorAddress,
      gasPrice: config.gasPrice,
      gas: config.gasLimit
    });
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
    new Web3WalletHelper(openST.web3()).init();

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
      erc20TokenContractAddress, // this will be coGateway contract address. passing dummy value for now.
      tokenRulesContractAddress,
      requirement,
      wallets
    );
    tokenHolderContractAddress = tokenHolderDeployReceipt.contractAddress;

    console.log('* Authorize session called');
    await authorizeSession(openST, tokenHolderContractAddress, config.ephemeralKey, wallets);

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
    await executeSampleRule(openST, sampleCustomRuleContractAddress, tokenHolderContractAddress, config.ephemeralKey);

    let afterBalance = await checkBalance(openST, erc20TokenContractAddress, tokenHolderContractAddress);

    const BigNumber = require('bignumber.js');
    let beforeBalanceBn = new BigNumber(beforeBalance);
    let afterBalanceBn = new BigNumber(afterBalance);

    assert.equal(beforeBalanceBn.minus(afterBalanceBn).toString(10), '100');
  });
});
