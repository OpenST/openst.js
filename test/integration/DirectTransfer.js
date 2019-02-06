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
  Mosaic = require('@openstfoundation/mosaic-tbd');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  RulesSetup = Package.Setup.Rules,
  MockContractsDeployer = require('./../utils/MockContractsDeployer'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
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
  abiBinProvider = new AbiBinProvider(),
  bytesBaseCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.baseCurrencyCode.toString());

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
  mockToken,
  owner = config.deployerAddress,
  tokenHolderSender,
  tokenHolderFirstReceiver,
  tokenHolderSecondReceiver,
  gnosisSafeProxy,
  ephemeralKey,
  mockTokenDeployerInstance;

describe('Direct transfers between TH contracts', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
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

    let tokenRulesInstance = ContractsInstance.TokenRules(tokenRulesAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await tokenRulesInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await tokenRulesInstance.methods.organization().call(),
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

  it('Deploys PricerRule contract', async function() {
    const rulesSetup = new RulesSetup(auxiliaryWeb3, organization, mockToken, tokenRulesAddress);
    const pricerRulesDeployResponse = await rulesSetup.deployPricerRule(
      bytesBaseCurrencyCode,
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

  it('Registers PricerRule rule', async function() {
    // Only worker can registerRule.
    const txOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    const tokenRulesInstance = new TokenRules(tokenRulesAddress, auxiliaryWeb3),
      pricerRuleName = 'PricerRule',
      pricerRuleAbi = abiBinProvider.getABI('PricerRule'),
      response = await tokenRulesInstance.registerRule(
        pricerRuleName,
        pricerRuleAddress,
        pricerRuleAbi.toString(),
        txOptions
      );

    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleName, pricerRuleName);
    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleAddress, pricerRuleAddress);

    // Verify the rule data using rule name.
    const ruleByNameData = await tokenRulesInstance.getRuleByName(pricerRuleName, txOptions);
    assert.strictEqual(ruleByNameData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByNameData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');

    // Verify the rule data using rule address.
    const ruleByAddressData = await tokenRulesInstance.getRuleByAddress(pricerRuleAddress, txOptions);
    assert.strictEqual(ruleByAddressData.ruleName, pricerRuleName, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByAddressData.ruleAddress, pricerRuleAddress, pricerRuleAddress, 'Incorrect rule address');
  });

  it('Creates first user wallet', async function() {
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
      config.sessionKeysSpendingLimits,
      config.sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
    tokenHolderSender = userWalletEvent._tokenHolderProxy;
  });

  it('Should create second user wallet', async function() {
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
      config.sessionKeysSpendingLimits,
      config.sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
    tokenHolderFirstReceiver = userWalletEvent._tokenHolderProxy;
  });

  it('Creates a company wallet', async function() {
    const userInstance = new User(
      null,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    const sessionKeys = [wallets[5].address];

    const response = await userInstance.createCompanyWallet(
      proxyFactoryAddress,
      thMasterCopyAddress,
      sessionKeys,
      config.sessionKeysSpendingLimits,
      config.sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'Company wallet creation failed.');

    // Fetching the company tokenholder proxy address for the user.
    const returnValues = response.events.ProxyCreated.returnValues;
    const proxyEvent = JSON.parse(JSON.stringify(returnValues));

    tokenHolderSecondReceiver = proxyEvent._proxy;
    assert.isNotNull(tokenHolderSecondReceiver, 'Company TH contract address should not be null.');
  });

  it('Performs direct transfer of tokens', async function() {
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
      transferAmounts = [20, 10];

    const directTransferExecutable = tokenHolder.getDirectTransferExecutableData(transferTos, transferAmounts),
      nonce = 0;

    let transaction = {
      from: tokenHolderSender,
      to: tokenRulesAddress,
      data: directTransferExecutable,
      nonce: nonce,
      callPrefix: await tokenHolder.getTokenHolderExecuteRuleCallPrefix(),
      value: 0,
      gasPrice: 0,
      gas: 0
    };

    const vrs = ephemeralKey.signEIP1077Transaction(transaction);

    await tokenHolder.executeRule(directTransferExecutable, nonce, vrs.r, vrs.s, vrs.v, txOptions);

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
