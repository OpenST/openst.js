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
  PricerRule = require('../../lib/helper/rules/PricerRule');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  RulesSetup = Package.Setup.Rules,
  Contracts = Package.Contracts,
  User = Package.Helpers.User,
  TokenRules = Package.Helpers.TokenRules,
  AbiBinProvider = Package.AbiBinProvider,
  TokenHolder = Package.Helpers.TokenHolder;

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  ContractsInstance = new Contracts(auxiliaryWeb3),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper,
  abiBinProvider = new AbiBinProvider();

let txOptions = {
  from: config.deployerAddress,
  gasPrice: config.gasPrice,
  gas: config.gas
};

let wallets,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  proxyFactoryAddress,
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
  tokenHolderFirstReceiver,
  tokenHolderSecondReceiver,
  gnosisSafeProxy,
  ephemeralKey,
  mockTokenDeployerInstance,
  tokenRulesObject;

describe('TH transfers through PricerRule Pay', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
    relayer = facilitator;
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

    const tokenRulesContractInstance = ContractsInstance.TokenRules(tokenRulesAddress, txOptions);

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

  it('Deploys PriceOracle contract', async function() {});

  it('Deploys PricerRule contract', async function() {
    const rulesSetup = new RulesSetup(auxiliaryWeb3, organization, mockToken, tokenRulesAddress);
    const pricerRulesDeployResponse = await rulesSetup.deployPricerRule(
      config.baseCurrencyCode,
      config.conversionRate,
      config.conversionRateDecimals,
      config.requiredPriceOracleDecimals,
      txOptions
    );
    assert.strictEqual(pricerRulesDeployResponse.receipt.status, true);
    pricerRuleAddress = pricerRulesDeployResponse.receipt.contractAddress;
    const pricerRuleInstance = ContractsInstance.PricerRule(pricerRuleAddress, txOptions);
    // Sanity check
    assert.strictEqual(
      await pricerRuleInstance.methods.tokenRules().call(),
      tokenRulesAddress,
      'TokenRules address is incorrect!'
    );
  });

  it('Adds PriceOracle contract in PricerRule', async function() {});

  it('Sets AcceptanceMargin in PricerRule', async function() {});

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
  });

  it('Creates first receiver user wallet', async function() {
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
    tokenHolderFirstReceiver = userWalletEvent._tokenHolderProxy;
  });

  it('Create second receiver user wallet', async function() {
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
    tokenHolderSecondReceiver = userWalletEvent._tokenHolderProxy;
  });

  it('Performs transfer through PricerRule.pay', async function() {
    const tokenHolder = new TokenHolder(auxiliaryWeb3, tokenRulesAddress, tokenHolderSender),
      mockTokenAbi = mockTokenDeployerInstance.abiBinProvider.getABI('MockToken'),
      contract = new auxiliaryWeb3.eth.Contract(mockTokenAbi, mockToken, txOptions);

    // Funding TH proxy with tokens.
    const amount = config.tokenHolderBalance,
      txObject = contract.methods.transfer(tokenHolderSender, amount);
    await txObject.send(txOptions);

    const initialTHProxyBalance = await contract.methods.balanceOf(tokenHolderSender).call(),
      transferTos = [tokenHolderFirstReceiver, tokenHolderSecondReceiver],
      firstReceiverInitialBalance = await contract.methods.balanceOf(tokenHolderFirstReceiver).call(),
      secondReceiverInitialBalance = await contract.methods.balanceOf(tokenHolderSecondReceiver).call(),
      transferAmounts = ['20000000000', '10000000000'];

    const nonce = 0;

    const pricerRuleObject = new PricerRule(auxiliaryWeb3, pricerRuleAddress);
    const pricerRulePayExecutable = pricerRuleObject.getPayExecutableData(
      tokenHolderSender,
      transferTos,
      transferAmounts,
      null,
      intendedPrice
    );

    let transaction = {
      from: relayer,
      to: tokenHolderSender,
      data: pricerRulePayExecutable,
      nonce: nonce,
      callPrefix: await tokenHolder.getTokenHolderExecuteRuleCallPrefix(),
      value: 0,
      gasPrice: 0,
      gas: 0
    };

    const vrs = ephemeralKey.signEIP1077Transaction(transaction);

    await tokenHolder.executeRule(pricerRulePayExecutable, nonce, vrs.r, vrs.s, vrs.v, txOptions);

    const finalTHProxyBalance = await contract.methods.balanceOf(tokenHolderSender).call(),
      firstReceiverFinalBalance = await contract.methods.balanceOf(tokenHolderFirstReceiver).call(),
      secondReceiverFinalBalance = await contract.methods.balanceOf(tokenHolderSecondReceiver).call(),
      firstReceiverExpectedBalance = parseInt(firstReceiverInitialBalance) + transferAmounts[0],
      secondReceiverExpectedBalance = parseInt(secondReceiverInitialBalance) + transferAmounts[1];

    assert.strictEqual(
      initialTHProxyBalance - transferAmounts[0] - transferAmounts[1],
      parseInt(finalTHProxyBalance),
      `TokenHolder sender balance is ${finalTHProxyBalance} and expected balance is ${initialTHProxyBalance -
        transferAmounts[0] -
        transferAmounts[1]}`
    );

    assert.strictEqual(
      parseInt(firstReceiverFinalBalance),
      firstReceiverExpectedBalance,
      `First receiver account token balance is ${firstReceiverFinalBalance} and expected balance is ${firstReceiverExpectedBalance}`
    );

    assert.strictEqual(
      parseInt(secondReceiverFinalBalance),
      secondReceiverExpectedBalance,
      `Second receiver account token balance is ${secondReceiverFinalBalance} and expected balance is ${secondReceiverExpectedBalance}`
    );
  });
});
