const Web3 = require('web3');
const { assert } = require('chai');
const BN = require('bn.js');
const Package = require('../../index');

const MockContractsDeployer = require('./../utils/MockContractsDeployer');
const config = require('../utils/configReader');
const { dockerSetup, dockerTeardown } = require('./../../utils/docker');
const Utils = require('../../utils/Utils');

const { Contracts, AbiBinProvider } = Package;
const { Organization } = Package.ContractInteract;
const UserSetup = Package.Setup.User;
const PricerRuleHelper = Package.Helpers.Rules.PricerRule;

let auxiliaryWeb3,
  txOptions,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  tokenRulesAddress,
  pricerRuleAddress,
  worker,
  organizationAddress,
  eip20Token,
  tokenHolderSender,
  mockTokenDeployerInstance,
  deployerAddress,
  priceOracleAddress,
  priceOracleOwner,
  priceOracleOpsAddress,
  pricerRuleHelperObject,
  accountsOrigin,
  bytesBaseCurrencyCode,
  bytesPayCurrencyCode,
  delayedRecoveryModuleMasterCopyAddress,
  createAndAddModulesAddress,
  proxyFactoryAddress,
  ephemeralKey;

describe('TH transfers through PricerRule Pay', async function() {
  before(async function() {
    const { rpcEndpointOrigin } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpointOrigin);
    accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    priceOracleOwner = accountsOrigin[0];
    worker = accountsOrigin[0];
    priceOracleOpsAddress = accountsOrigin[1];
    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    await auxiliaryWeb3.eth.accounts.wallet.create(10);
  });

  after(() => {
    dockerTeardown();
  });

  it('Performs initial setup for economy', async function() {
    const orgConfig = {
      deployer: deployerAddress,
      owner: deployerAddress,
      admin: worker,
      workers: [worker],
      workerExpirationHeight: config.workerExpirationHeight
    };
    const organizationContractInstance = await Organization.setup(auxiliaryWeb3, orgConfig, txOptions);
    organizationAddress = organizationContractInstance.address;
    assert.isNotNull(organizationAddress, 'Organization contract address should not be null.');

    mockTokenDeployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);
    await mockTokenDeployerInstance.deployMockToken();

    eip20Token = mockTokenDeployerInstance.addresses.MockToken;
    assert.isNotNull(eip20Token, 'EIP20Token contract address should not be null.');

    const tokenRules = new Package.Setup.TokenRules(auxiliaryWeb3);

    const response = await tokenRules.deploy(organizationAddress, eip20Token, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;

    const tokenRulesContractInstance = Contracts.getTokenRules(
      auxiliaryWeb3,
      response.receipt.contractAddress,
      txOptions
    );
    // Verifying stored organization and token address.
    assert.strictEqual(
      eip20Token,
      await tokenRulesContractInstance.methods.token().call(),
      'Token address is incorrect'
    );
    assert.strictEqual(
      eip20Token,
      await tokenRulesContractInstance.methods.token().call(),
      'Token address is incorrect'
    );
    assert.strictEqual(
      organizationAddress,
      await tokenRulesContractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Performs Setup of TokenHolder, MultiSig, DelayedRecoveryModule master copies', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.isNotNull(thMasterCopyAddress, 'TH master copy contract address should not be null.');

    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.isNotNull(gnosisSafeMasterCopyAddress, 'gnosis safe master copy contract address should not be null.');

    const txResponse = await userSetup.deployDelayedRecoveryModuleMasterCopy(txOptions);
    delayedRecoveryModuleMasterCopyAddress = txResponse.receipt.contractAddress;
    assert.isNotNull(
      delayedRecoveryModuleMasterCopyAddress,
      "DelayedRecoveryModule master copy contract's address is null."
    );
  });

  it('Performs setup of CreateAndAddModules, UserWalletFactory, ProxyFactory contracts', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const txResponse = await userSetup.deployCreateAndAddModules(txOptions);
    createAndAddModulesAddress = txResponse.receipt.contractAddress;
    assert.isNotNull(createAndAddModulesAddress, "createAndAddModules contract's address is null.");

    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.isNotNull(userWalletFactoryAddress, 'UserWalletFactory contract address should not be null.');

    const proxyFactoryResponse = await userSetup.deployProxyFactory(txOptions);
    proxyFactoryAddress = proxyFactoryResponse.receipt.contractAddress;
    assert.isNotNull(proxyFactoryAddress, 'Proxy contract address should not be null.');
  });

  it('Performs setup of PriceOracle', async function() {
    bytesBaseCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.baseCurrencyCode);
    bytesPayCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.payCurrencyCode);
    const pricerOracleArgs = [bytesBaseCurrencyCode, bytesPayCurrencyCode];
    const priceOracleTxOptions = {
      from: priceOracleOwner,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const priceOracleDeployResponse = await mockTokenDeployerInstance.deployPriceOracle(
      auxiliaryWeb3,
      pricerOracleArgs,
      priceOracleTxOptions
    );
    priceOracleAddress = mockTokenDeployerInstance.addresses.PriceOracle;
    assert.isNotNull(priceOracleAddress, 'PriceOracle contract address should not be null.');

    const setOpsTxOptions = {
      from: priceOracleOwner,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const jsonInterface = mockTokenDeployerInstance.abiBinProvider.getABI('PriceOracle');
    const priceOracleContractInstance = new auxiliaryWeb3.eth.Contract(jsonInterface, priceOracleAddress);
    const setOpsTxObject = priceOracleContractInstance.methods.setOpsAddress(priceOracleOpsAddress);
    await Utils.sendTransaction(setOpsTxObject, setOpsTxOptions);
    assert.strictEqual(await priceOracleContractInstance.methods.opsAddress().call(), priceOracleOpsAddress);

    const setPriceOptions = {
      from: priceOracleOpsAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const setPriceTxObject = priceOracleContractInstance.methods.setPrice(config.price);
    await Utils.sendTransaction(setPriceTxObject, setPriceOptions);
    assert.strictEqual(await priceOracleContractInstance.methods.getPrice().call(), config.price);
  });

  it('Performs setup of PricerRule', async function() {
    const rulesSetup = new Package.Setup.Rules(auxiliaryWeb3, organizationAddress, eip20Token, tokenRulesAddress);
    const pricerRulesDeployResponse = await rulesSetup.deployPricerRule(
      config.baseCurrencyCode,
      config.conversionRate,
      config.conversionRateDecimals,
      config.requiredPriceOracleDecimals,
      txOptions
    );
    pricerRuleAddress = pricerRulesDeployResponse.receipt.contractAddress;
    const pricerRuleInstance = Contracts.getPricerRule(auxiliaryWeb3, pricerRuleAddress, txOptions);
    // Sanity check
    assert.strictEqual(
      await pricerRuleInstance.methods.tokenRules().call(),
      tokenRulesAddress,
      'TokenRules address is incorrect!'
    );

    const priceOracleTxOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    pricerRuleHelperObject = new PricerRuleHelper(auxiliaryWeb3, pricerRuleAddress);
    await pricerRuleHelperObject.addPriceOracle(priceOracleAddress, priceOracleTxOptions);
    assert.strictEqual(
      await pricerRuleInstance.methods.baseCurrencyPriceOracles(bytesPayCurrencyCode).call(),
      priceOracleAddress
    );

    const setAcceptanceMarginReceipt = await pricerRuleHelperObject.setAcceptanceMargin(
      config.payCurrencyCode,
      config.acceptanceMargin,
      priceOracleTxOptions
    );
    const contractAcceptanceMargin = await pricerRuleInstance.methods
      .baseCurrencyPriceAcceptanceMargins(bytesPayCurrencyCode)
      .call();
    assert.strictEqual(contractAcceptanceMargin, config.acceptanceMargin);
  });

  it('Perform registration of PricerRule in TokenRules', async function() {
    // Only worker can registerRule.
    const registerRuleTxOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    const tokenRulesHelperObject = new Package.Helpers.TokenRules(tokenRulesAddress, auxiliaryWeb3);
    const pricerRuleName = 'PricerRule';
    const abiBinProvider = new AbiBinProvider();
    const pricerRuleAbi = abiBinProvider.getABI('PricerRule');
    const response = await tokenRulesHelperObject.registerRule(
      pricerRuleName,
      pricerRuleAddress,
      pricerRuleAbi.toString(),
      registerRuleTxOptions
    );

    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleName, pricerRuleName);
    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleAddress, pricerRuleAddress);

    // Verify the rule data using rule name.
    const ruleByNameData = await tokenRulesHelperObject.getRuleByName(pricerRuleName, registerRuleTxOptions);
    assert.strictEqual(ruleByNameData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByNameData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');

    // Verify the rule data using rule address.
    const ruleByAddressData = await tokenRulesHelperObject.getRuleByAddress(pricerRuleAddress, registerRuleTxOptions);
    assert.strictEqual(ruleByAddressData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByAddressData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');
  });

  it('Creates sender user wallet', async function() {
    const userInstance = new Package.Helpers.User(
      thMasterCopyAddress,
      gnosisSafeMasterCopyAddress,
      delayedRecoveryModuleMasterCopyAddress,
      createAndAddModulesAddress,
      eip20Token,
      tokenRulesAddress,
      userWalletFactoryAddress,
      proxyFactoryAddress,
      auxiliaryWeb3
    );

    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];
    const owners = [auxiliaryWeb3.eth.accounts.wallet[1].address];
    const threshold = 1;
    const sessionKeys = [ephemeralKey.address];

    const recoveryOwnerAddress = auxiliaryWeb3.eth.accounts.wallet[3].address;
    const recoveryControllerAddress = auxiliaryWeb3.eth.accounts.wallet[4].address;
    const recoveryBlockDelay = 10;

    const response = await userInstance.createUserWallet(
      owners,
      threshold,
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay,
      sessionKeys,
      [config.sessionKeySpendingLimit],
      [config.sessionKeyExpirationHeight],
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    tokenHolderSender = userWalletEvent._tokenHolderProxy;

    const senderTokenHolderInstance = await Contracts.getTokenHolder(auxiliaryWeb3, tokenHolderSender, txOptions);
    const sessionKeyData = await senderTokenHolderInstance.methods.sessionKeys(ephemeralKey.address).call();
    const sessionWindow = await senderTokenHolderInstance.methods.sessionWindow().call();
    assert.strictEqual(
      sessionKeyData.spendingLimit,
      config.sessionKeySpendingLimit,
      'Session spending limit is incorrect'
    );
    assert.strictEqual(
      sessionKeyData.expirationHeight,
      config.sessionKeyExpirationHeight,
      'Session expiration height is incorrect'
    );
    assert.strictEqual(sessionKeyData.nonce, '0', 'Session key nonce is incorrect');
    assert.strictEqual(sessionKeyData.session, sessionWindow, 'Session window is incorrect');
  });

  it('Performs transfer through PricerRule.pay', async function() {
    const tokenHolder = new Package.Helpers.TokenHolder(auxiliaryWeb3, tokenHolderSender),
      mockTokenAbi = mockTokenDeployerInstance.abiBinProvider.getABI('MockToken'),
      eip20TokenContractInstance = new auxiliaryWeb3.eth.Contract(mockTokenAbi, eip20Token, txOptions);

    // Funding TH proxy with tokens.
    const txObject = eip20TokenContractInstance.methods.transfer(tokenHolderSender, config.senderTokenHolderBalance);
    await txObject.send(txOptions);
    const initialSenderBalance = await eip20TokenContractInstance.methods.balanceOf(tokenHolderSender).call();
    assert.strictEqual(initialSenderBalance, config.senderTokenHolderBalance, 'Initial sender TH balance mismatch!');

    const firstReceiver = accountsOrigin[1];
    const secondReceiver = accountsOrigin[2];
    const transferTos = [firstReceiver, secondReceiver],
      firstReceiverInitialBalance = await eip20TokenContractInstance.methods.balanceOf(firstReceiver).call(),
      secondReceiverInitialBalance = await eip20TokenContractInstance.methods.balanceOf(secondReceiver).call(),
      transferAmountsInUSD = ['20000000000000000000', '10000000000000000000']; // $20 and $10

    const nonce = 0;
    const pricerRulePayExecutable = pricerRuleHelperObject.getPayExecutableData(
      tokenHolderSender,
      transferTos,
      transferAmountsInUSD,
      config.payCurrencyCode,
      config.price
    );

    let transaction = {
      from: tokenHolderSender,
      to: pricerRuleAddress,
      data: pricerRulePayExecutable,
      nonce: nonce,
      callPrefix: await tokenHolder.getTokenHolderExecuteRuleCallPrefix(),
      value: 0,
      gasPrice: 0,
      gas: 0
    };

    const vrs = ephemeralKey.signEIP1077Transaction(transaction);

    const executeRuleResponse = await tokenHolder.executeRule(
      pricerRuleAddress,
      pricerRulePayExecutable,
      nonce,
      vrs.r,
      vrs.s,
      vrs.v,
      txOptions
    );
    assert.strictEqual(executeRuleResponse.status, true, 'ExecuteRule response is failure!');

    const finalSenderBalance = await eip20TokenContractInstance.methods.balanceOf(tokenHolderSender).call(),
      firstReceiverFinalBalance = await eip20TokenContractInstance.methods.balanceOf(firstReceiver).call(),
      secondReceiverFinalBalance = await eip20TokenContractInstance.methods.balanceOf(secondReceiver).call();

    const firstReceiverBTAmount = PricerRuleHelper.convertPayCurrencyToToken(
      config.eip20TokenDecimals,
      transferAmountsInUSD[0],
      config.price,
      config.conversionRate,
      config.conversionRateDecimals
    );
    const secondReceiverBTAmount = PricerRuleHelper.convertPayCurrencyToToken(
      config.eip20TokenDecimals,
      transferAmountsInUSD[1],
      config.price,
      config.conversionRate,
      config.conversionRateDecimals
    );

    const firstReceiverExpectedBalance = new BN(firstReceiverInitialBalance).add(firstReceiverBTAmount);
    const secondReceiverExpectedBalance = new BN(secondReceiverInitialBalance).add(secondReceiverBTAmount);
    const expectedSenderBalance = new BN(initialSenderBalance).sub(firstReceiverBTAmount).sub(secondReceiverBTAmount);

    assert.strictEqual(
      finalSenderBalance,
      expectedSenderBalance.toString(10),
      `TokenHolder sender balance is ${finalSenderBalance} and expected balance is ${expectedSenderBalance}`
    );

    assert.strictEqual(
      firstReceiverFinalBalance,
      firstReceiverExpectedBalance.toString(10),
      `First receiver account token balance is ${firstReceiverFinalBalance} and expected balance is ${firstReceiverExpectedBalance}`
    );

    assert.strictEqual(
      secondReceiverFinalBalance,
      secondReceiverExpectedBalance.toString(10),
      `Second receiver account token balance is ${secondReceiverFinalBalance} and expected balance is ${secondReceiverExpectedBalance}`
    );
  });
});
