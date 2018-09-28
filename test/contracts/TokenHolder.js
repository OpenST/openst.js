/**
 * Sample Rule Execute
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  abis = require('../../test/utils/abis'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

let openST,
  deployParams,
  deployer,
  erc20TokenContractAddress,
  tokenRulesContractAddress,
  tokenHolderContractAddress,
  sampleCustomRuleContractAddress,
  ephemeralKeyAccount,
  requirement;

const ruleName = 'transferFrom';
const wallets = [config.wallet1, config.wallet2];

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
      gas: config.gas
    });

  assert.isOk(
    submitAuthorizeSession1Response.events.SessionAuthorizationSubmitted,
    'SessionAuthorizationSubmitted event not obtained.'
  );

  console.log('** SessionAuthorizationSubmitted event obtained.');

  assert.isOk(submitAuthorizeSession1Response.events.TransactionConfirmed, 'TransactionConfirmed event not obtained.');

  console.log('** TransactionConfirmed event obtained.');

  let transactionId = submitAuthorizeSession1Response.events.SessionAuthorizationSubmitted.returnValues._transactionId;

  while (len--) {
    let currWallet = wallets[len];

    console.log('* confirmTransaction from wallet:', currWallet);

    // Authorize an ephemeral public key
    let confirmTransactionResponse = await tokenHolder.confirmTransaction(transactionId).send({
      from: currWallet,
      gasPrice: config.gasPrice,
      gas: config.gas
    });

    assert.isOk(confirmTransactionResponse.events.TransactionConfirmed, 'TransactionConfirmed event not obtained.');

    console.log('** TransactionConfirmed event obtained.');
  }

  let ephemeralKeysResponse = await tokenHolder.ephemeralKeys(ephemeralKey).call({});
  console.log('ephemeralKeysResponse', ephemeralKeysResponse);

  assert.isTrue(ephemeralKeysResponse.status == 1, 'Ephemeral key status is not AUTHORIZED');
  console.log('** Ephemeral key', ephemeralKey, 'status is AUTHORIZED.');

  assert.isTrue(ephemeralKeysResponse.expirationHeight > currentBlockNumber, 'Ephemeral key has expired');
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
    gas: config.gas
  });
};

let registerRule = async function(openST, tokenRulesContractAddress, ruleName, ruleContractAddress, ruleAbi) {
  ruleAbi = JSON.stringify(ruleAbi);

  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);

  console.log('* registerRule with _ruleName:', ruleName, '_ruleAddress:', ruleContractAddress, '_ruleAbi:', ruleAbi);

  let registerRuleResponse = await tokenRules.registerRule(ruleName, ruleContractAddress, ruleAbi).send({
    from: config.organizationAddress,
    gasPrice: config.gasPrice,
    gas: config.gas
  });

  assert.isOk(registerRuleResponse.events.RuleRegistered, 'RuleRegistered event not obtained.');

  console.log('** RuleRegistered event obtained.');
};

let executeSampleRule = async function(
  openST,
  tokenRulesContractAddress,
  tokenHolderContractAddress,
  ephemeralKeyAccount
) {};

let checkBalance = async function(openST, erc20TokenContractAddress, address) {
  let mockToken = new (openST.web3()).eth.Contract(abis.mockToken, erc20TokenContractAddress);
  return mockToken.methods.balanceOf(address).call({});
};

// Load cache service
describe('test/contracts/TokenHolder', function() {
  before(async function() {
    // Creating object of OpenST
    const OpenST = require('../../index.js');
    openST = new OpenST(config.gethRpcEndPoint);

    deployParams = {
      from: config.deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    // adding the addresses to the web3 wallet
    let web3WalletHelper = new Web3WalletHelper(openST.web3());
    await web3WalletHelper.init();

    deployer = new openST.Deployer(deployParams);
    // deploy ERC20
    console.log('* Deploying ERC20 Token');
    let erc20DeployReceipt = await deployer.deployERC20Token();
    erc20TokenContractAddress = erc20DeployReceipt.contractAddress;

    // deploy TokenRules
    console.log('* Deploying TokenRules');
    let tokenRulesDeployReceipt = await deployer.deployTokenRules(
      config.organizationAddress,
      erc20TokenContractAddress
    );
    tokenRulesContractAddress = tokenRulesDeployReceipt.contractAddress;

    //Compute requirement.
    requirement = wallets.length;

    console.log('* Deploying Sample Custom Rule');
    let sampleCustomRuleDeployReceipt = await deployer.deploySimpleTransferRule(tokenRulesContractAddress);
    sampleCustomRuleContractAddress = sampleCustomRuleDeployReceipt.contractAddress;

    console.log('* Registering Sample Custom Rule');
    await registerRule(
      openST,
      tokenRulesContractAddress,
      ruleName,
      sampleCustomRuleContractAddress,
      abis.sampleCustomRule
    );
    console.log('* Starting Test-Cases');
  });

  //All Auto Generated Code needs to be tested more than once as prototype
  //of the class is being manipulated during construction of the instance.
  let noOfInstances = 2;
  while (noOfInstances--) {
    let descPostFix = noOfInstances ? '' : '(retest with new instance)';

    it(`should deploy a new TokenHolder Contract  ${descPostFix}`, function() {
      return deployer
        .deployTokenHolder(erc20TokenContractAddress, tokenRulesContractAddress, requirement, wallets)
        .then((receipt) => {
          tokenHolderContractAddress = receipt.contractAddress;
          console.log('* Funding ERC20 tokens from deployer address');
          return fundERC20Tokens(openST, erc20TokenContractAddress, tokenHolderContractAddress);
        });
    });

    it(`Authorise ephemeral key ${descPostFix}`, async function() {
      // create a ephemeralKey
      ephemeralKeyAccount = openST.web3().eth.accounts.create();
      await authorizeSession(openST, tokenHolderContractAddress, ephemeralKeyAccount.address, wallets);
    });

    it(`Execute Sample Custom Rule ${descPostFix}`, async function() {
      console.log('* Execute Sample Custom Rule');

      console.log('** Fetching initial balance of the tokenHolder contract address.');
      let beforeBalance = await checkBalance(openST, erc20TokenContractAddress, tokenHolderContractAddress);

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
          from: config.facilitatorAddress,
          gasPrice: config.gasPrice,
          gas: config.gas
        });

      assert.isOk(executeRuleResponse.events.RuleExecuted, 'RuleExecuted event not obtained.');
      console.log('** RuleExecuted event obtained.');

      assert.isOk(executeRuleResponse.events.RuleExecuted.returnValues._status, 'Rule Executed with status false.');
      console.log('** Rule executed with status true.');

      console.log('** Confirming change in balance of token holder contract');
      let afterBalance = await checkBalance(openST, erc20TokenContractAddress, tokenHolderContractAddress);

      let beforeBalanceBn = new BigNumber(beforeBalance);
      let afterBalanceBn = new BigNumber(afterBalance);

      assert.equal(
        beforeBalanceBn.minus(afterBalanceBn).toString(10),
        '100',
        'Token transfer verification using before and after balance failed.'
      );

      console.log('** Token transfer verification using before and after balance succeeded.');
    });
  }
});
