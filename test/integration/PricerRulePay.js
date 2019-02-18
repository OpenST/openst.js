// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index'),
  Mosaic = require('@openstfoundation/mosaic-tbd'),
  MockContractsDeployer = require('./../utils/MockContractsDeployer'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
  PricerRule = require('../../lib/helper/rules/PricerRule'),
  TxSender = require('../../utils/TxSender'),
  BN = require('bn.js');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  RulesSetup = Package.Setup.Rules,
  OpenSTContracts = Package.Contracts,
  User = Package.Helpers.User,
  TokenRules = Package.Helpers.TokenRules,
  AbiBinProvider = Package.AbiBinProvider,
  TokenHolder = Package.Helpers.TokenHolder,
  PricerRuleHelper = Package.Helpers.Rules.PricerRule;

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  openSTContractsInstance = new OpenSTContracts(auxiliaryWeb3),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper,
  abiBinProvider = new AbiBinProvider(),
  bytesBaseCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.baseCurrencyCode.toString()),
  bytesPayCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.payCurrencyCode.toString());

let txOptions = {
  from: config.deployerAddress,
  gasPrice: config.gasPrice,
  gas: config.gas
};

let wallets,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  tokenRulesAddress,
  pricerRuleAddress,
  worker,
  organization,
  beneficiary,
  facilitator,
  relayer,
  mockToken,
  owner = config.deployerAddress,
  tokenHolderSender,
  firstReceiver,
  secondReceiver,
  gnosisSafeProxy,
  ephemeralKey,
  mockTokenDeployerInstance,
  tokenRulesObject,
  priceOracleAddress,
  priceOracleOwner = config.deployerAddress,
  priceOracleOpsAddress,
  pricerRuleHelperObject,
  priceOracleContractInstance,
  pricerRuleInstance;

describe('TH transfers through PricerRule Pay', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
    relayer = facilitator;
    priceOracleOpsAddress = wallets[4].address;
    firstReceiver = wallets[5].address;
    secondReceiver = wallets[6].address;
  });

  it('Deploys Organization contract', async function() {
    let orgHelper = new OrganizationHelper(auxiliaryWeb3, null);
    const orgConfig = {
      deployer: config.deployerAddress,
      owner: owner,
      workers: worker,
      workerExpirationHeight: '20000000'
    };

    await orgHelper.setup(orgConfig);
    organization = orgHelper.address;

    assert.isNotNull(organization, 'Organization contract address should not be null.');
  });

  // TODO Update to EIP20Token
  it('Deploys EIP20Token contract', async function() {
    mockTokenDeployerInstance = new MockContractsDeployer(config.deployerAddress, auxiliaryWeb3);

    await mockTokenDeployerInstance.deployMockToken();

    mockToken = mockTokenDeployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Deploys TokenRules contract', async function() {
    const tokenRulesSetupInstance = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRulesSetupInstance.deploy(organization, mockToken, txOptions);
    tokenRulesAddress = response.receipt.contractAddress;
    assert.isNotNull(tokenRulesAddress, 'tokenRules contract address should not be null.');

    const tokenRulesContractInstance = openSTContractsInstance.TokenRules(tokenRulesAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(
      mockToken,
      await tokenRulesContractInstance.methods.token().call(),
      'Token address is incorrect'
    );
    assert.strictEqual(
      organization,
      await tokenRulesContractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Deploys Gnosis MultiSig MasterCopy contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
    assert.isNotNull(gnosisSafeMasterCopyAddress, 'gnosis safe master copy contract address should not be null.');
  });

  it('Deploys TokenHolder MasterCopy contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
    assert.isNotNull(thMasterCopyAddress, 'TH master copy contract address should not be null.');
  });

  it('Deploys UserWalletFactory contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
    assert.isNotNull(userWalletFactoryAddress, 'UserWalletFactory contract address should not be null.');
  });

  it('Deploys ProxyFactory contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const proxyFactoryResponse = await userSetup.deployProxyFactory(txOptions);
    proxyFactoryAddress = proxyFactoryResponse.receipt.contractAddress;
    assert.strictEqual(proxyFactoryResponse.receipt.status, true);
    assert.isNotNull(proxyFactoryAddress, 'Proxy contract address should not be null.');
  });

  it('Deploys PriceOracle contract', async function() {
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
    assert.strictEqual(priceOracleDeployResponse.status, true);
    priceOracleAddress = mockTokenDeployerInstance.addresses.PriceOracle;
    assert.isNotNull(priceOracleAddress, 'PriceOracle contract address should not be null.');
  });

  it('Sets Ops address in PriceOracle contract', async function() {
    const setOpsOptions = {
      from: priceOracleOwner,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const jsonInterface = mockTokenDeployerInstance.abiBinProvider.getABI('PriceOracle');
    priceOracleContractInstance = new auxiliaryWeb3.eth.Contract(jsonInterface, priceOracleAddress);
    const setOpsTxObject = priceOracleContractInstance.methods.setOpsAddress(priceOracleOpsAddress);
    const setOpsReceipt = await new TxSender(setOpsTxObject, auxiliaryWeb3, setOpsOptions).execute();
    assert.strictEqual(await priceOracleContractInstance.methods.opsAddress().call(), priceOracleOpsAddress);
  });

  it('Sets price in PriceOracle contract', async function() {
    const setPriceOptions = {
      from: priceOracleOpsAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const setPriceTxObject = priceOracleContractInstance.methods.setPrice(config.price);
    const setPriceReceipt = await new TxSender(setPriceTxObject, auxiliaryWeb3, setPriceOptions).execute();
    assert.strictEqual(setPriceReceipt.status, true);

    const setPriceValueFromContract = await priceOracleContractInstance.methods.getPrice().call();
    assert.strictEqual(setPriceValueFromContract, config.price);
  });

  it('Deploys PricerRule contract', async function() {
    const rulesSetup = new RulesSetup(auxiliaryWeb3, organization, mockToken, tokenRulesAddress);
    const pricerRulesDeployResponse = await rulesSetup.deployPricerRule(
      config.baseCurrencyCode,
      config.conversionRate,
      config.conversionRateDecimals,
      config.requiredPriceOracleDecimals,
      txOptions
    );
    pricerRuleAddress = pricerRulesDeployResponse.receipt.contractAddress;
    pricerRuleInstance = openSTContractsInstance.PricerRule(pricerRuleAddress, txOptions);
    // Sanity check
    assert.strictEqual(
      await pricerRuleInstance.methods.tokenRules().call(),
      tokenRulesAddress,
      'TokenRules address is incorrect!'
    );
  });

  it('Adds PriceOracle contract in PricerRule', async function() {
    const addPriceOracleTxOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    pricerRuleHelperObject = new PricerRule(auxiliaryWeb3, pricerRuleAddress);
    const addPriceOracleReceipt = await pricerRuleHelperObject.addPriceOracle(
      priceOracleAddress,
      addPriceOracleTxOptions
    );
    assert.strictEqual(
      await pricerRuleInstance.methods.baseCurrencyPriceOracles(bytesPayCurrencyCode).call(),
      priceOracleAddress
    );
  });

  it('Sets AcceptanceMargin in PricerRule', async function() {
    const setAcceptanceMarginTxOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    const setAcceptanceMarginReceipt = await pricerRuleHelperObject.setAcceptanceMargin(
      config.payCurrencyCode,
      config.acceptanceMargin,
      setAcceptanceMarginTxOptions
    );
    const contractAcceptanceMargin = await pricerRuleInstance.methods
      .baseCurrencyPriceAcceptanceMargins(bytesPayCurrencyCode)
      .call();
    assert.strictEqual(contractAcceptanceMargin, config.acceptanceMargin);
  });

  it('Registers PricerRule rule', async function() {
    // Only worker can registerRule.
    const txOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    tokenRulesObject = new TokenRules(tokenRulesAddress, auxiliaryWeb3);
    const pricerRuleName = 'PricerRule',
      pricerRuleAbi = abiBinProvider.getABI('PricerRule'),
      response = await tokenRulesObject.registerRule(
        pricerRuleName,
        pricerRuleAddress,
        pricerRuleAbi.toString(),
        txOptions
      );

    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleName, pricerRuleName);
    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleAddress, pricerRuleAddress);

    // Verify the rule data using rule name.
    const ruleByNameData = await tokenRulesObject.getRuleByName(pricerRuleName, txOptions);
    assert.strictEqual(ruleByNameData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByNameData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');

    // Verify the rule data using rule address.
    const ruleByAddressData = await tokenRulesObject.getRuleByAddress(pricerRuleAddress, txOptions);
    assert.strictEqual(ruleByAddressData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByAddressData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');
  });

  it('Creates sender user wallet', async function() {
    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    ephemeralKey = wallets[5];
    const owners = [wallets[3].address],
      threshold = 1,
      sessionKeys = [ephemeralKey.address];

    const response = await userInstance.createUserWallet(
      owners,
      threshold,
      config.NULL_ADDRESS,
      config.ZERO_BYTES,
      sessionKeys,
      [config.sessionKeySpendingLimit],
      [config.sessionKeyExpirationHeight],
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
    tokenHolderSender = userWalletEvent._tokenHolderProxy;

    const senderTokenHolderInstance = await OpenSTContracts.getTokenHolder(auxiliaryWeb3, tokenHolderSender, txOptions);
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
    const tokenHolder = new TokenHolder(auxiliaryWeb3, tokenHolderSender),
      mockTokenAbi = mockTokenDeployerInstance.abiBinProvider.getABI('MockToken'),
      eip20TokenContractInstance = new auxiliaryWeb3.eth.Contract(mockTokenAbi, mockToken, txOptions);

    // Funding TH proxy with tokens.
    const txObject = eip20TokenContractInstance.methods.transfer(tokenHolderSender, config.senderTokenHolderBalance);
    await txObject.send(txOptions);
    const initialSenderBalance = await eip20TokenContractInstance.methods.balanceOf(tokenHolderSender).call();
    assert.strictEqual(initialSenderBalance, config.senderTokenHolderBalance, 'Initial sender TH balance mismatch!');

    const transferTos = [firstReceiver, secondReceiver],
      firstReceiverInitialBalance = await eip20TokenContractInstance.methods.balanceOf(firstReceiver).call(),
      secondReceiverInitialBalance = await eip20TokenContractInstance.methods.balanceOf(secondReceiver).call(),
      transferAmountsInUSD = ['2000000000000000', '1000000000000000'];

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
      transferAmountsInUSD[0],
      config.price,
      config.conversionRate,
      config.conversionRateDecimals
    );
    const secondReceiverBTAmount = PricerRuleHelper.convertPayCurrencyToToken(
      transferAmountsInUSD[1],
      config.price,
      config.conversionRate,
      config.conversionRateDecimals
    );

    const firstReceiverExpectedBalance = new BN(firstReceiverInitialBalance).add(firstReceiverBTAmount);
    const secondReceiverExpectedBalance = new BN(firstReceiverInitialBalance).add(secondReceiverBTAmount);
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
