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
  Package = require('../../index');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  MockContractsDeployer = require('./../utils/MockContractsDeployer'),
  Mosaic = require('@openstfoundation/mosaic-tbd'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
  Contracts = Package.Contracts,
  User = Package.Helpers.User,
  AbiBinProvider = Package.AbiBinProvider,
  TokenRules = Package.Helpers.TokenRules,
  TokenHolder = Package.Helpers.TokenHolder;

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper;

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
  worker,
  organization,
  beneficiary,
  facilitator,
  mockToken,
  owner = config.deployerAddress,
  tokenHolderProxy,
  gnosisSafeProxy,
  ephemeralKey,
  deployerInstance,
  tokenRules;

describe('ExecuteRule', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
  });

  it('Should deploy Organization contract', async function() {
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
    deployerInstance = new MockContractsDeployer(config.deployerAddress, auxiliaryWeb3);

    await deployerInstance.deployMockToken();

    mockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(3 * 60000);

    tokenRules = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, mockToken, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;
    assert.isNotNull(tokenRulesAddress, 'tokenRules contract address should not be null.');

    let contractInstance = Contracts.getTokenRules(auxiliaryWeb3, response.receipt.contractAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await contractInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await contractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Should deploy Gnosis MultiSig MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
    assert.isNotNull(gnosisSafeMasterCopyAddress, 'gnosis safe master copy contract address should not be null.');
  });

  it('Should deploy TokenHolder MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
    assert.isNotNull(thMasterCopyAddress, 'TH master copy contract address should not be null.');
  });

  it('Should deploy UserWalletFactory contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
    assert.isNotNull(userWalletFactoryAddress, 'UserWalletFactory contract address should not be null.');
  });

  it('Should deploy ProxyFactory contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const proxyFactoryResponse = await userSetup.deployProxyFactory(txOptions);
    proxyFactoryAddress = proxyFactoryResponse.receipt.contractAddress;
    assert.strictEqual(proxyFactoryResponse.receipt.status, true);
    assert.isNotNull(proxyFactoryAddress, 'Proxy contract address should not be null.');
  });

  it('Should create a user wallet', async function() {
    this.timeout(3 * 60000);

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
      sessionKeys = [ephemeralKey.address],
      sessionKeysSpendingLimits = [1000000],
      sessionKeysExpirationHeights = [100000000000];

    const response = await userInstance.createUserWallet(
      owners,
      threshold,
      config.NULL_ADDRESS,
      config.ZERO_BYTES,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
    tokenHolderProxy = userWalletEvent._tokenHolderProxy;
  });

  it('Should create a company wallet', async function() {
    this.timeout(3 * 60000);

    const userInstance = new User(
      null,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    const sessionKeys = [wallets[5].address],
      sessionKeysSpendingLimits = [1000000],
      sessionKeysExpirationHeights = [100000000000];

    const response = await userInstance.createCompanyWallet(
      proxyFactoryAddress,
      thMasterCopyAddress,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'Company wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    const returnValues = response.events.ProxyCreated.returnValues;
    const proxyEvent = JSON.parse(JSON.stringify(returnValues));

    const companyTHProxy = proxyEvent._proxy;
    assert.isNotNull(companyTHProxy, 'Company TH contract address should not be null.');
  });

  it('Should register a rule', async function() {
    this.timeout(3 * 60000);

    // Only worker can registerRule.
    const txOptions = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    const rules = new TokenRules(tokenRulesAddress, auxiliaryWeb3),
      mockRule = 'TestRule',
      mockRuleAddress = tokenRulesAddress,
      abiBinProvider = new AbiBinProvider(),
      // TODO: update pricer abi here.
      rulesAbi = abiBinProvider.getABI('TokenRules'),
      response = await rules.registerRule(mockRule, mockRuleAddress, rulesAbi.toString(), txOptions);

    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleName, mockRule);
    assert.strictEqual(response.events.RuleRegistered['returnValues']._ruleAddress, mockRuleAddress);

    // Verify the rule data using rule name.
    const ruleByNameData = await rules.getRuleByName(mockRule);
    assert.strictEqual(ruleByNameData.ruleName, mockRule, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByNameData.ruleAddress, mockRuleAddress, mockRuleAddress, 'Incorrect rule address');

    // Verify the rule data using rule address.
    const ruleByAddressData = await rules.getRuleByAddress(mockRuleAddress);
    assert.strictEqual(ruleByAddressData.ruleName, mockRule, 'Incorrect rule name was registered');
    assert.strictEqual(ruleByAddressData.ruleAddress, mockRuleAddress, 'Incorrect rule address');
  });

  it('Should perform direct transfer of tokens', async function() {
    const tokenHolder = new TokenHolder(auxiliaryWeb3, tokenRulesAddress, tokenHolderProxy),
      mockTokenAbi = deployerInstance.abiBinProvider.getABI('MockToken'),
      contract = new auxiliaryWeb3.eth.Contract(mockTokenAbi, mockToken, txOptions);

    // Funding TH proxy with tokens.
    const amount = config.tokenHolderBalance,
      txObject = contract.methods.transfer(tokenHolderProxy, amount),
      receiver = wallets[6];
    await txObject.send(txOptions);

    const initialTHProxyBalance = await contract.methods.balanceOf(tokenHolderProxy).call(),
      transferTo = [receiver.address],
      receiverInitialBalance = await contract.methods.balanceOf(receiver.address).call(),
      transferAmount = [20];

    const directTransferExecutable = tokenHolder.getDirectTransferExecutableData(transferTo, transferAmount),
      nonce = 0;

    let transaction = {
      from: tokenHolderProxy,
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

    const finalTHProxyBalance = await contract.methods.balanceOf(tokenHolderProxy).call(),
      finalReceiverBalance = await contract.methods.balanceOf(receiver.address).call(),
      expectedReceiverBalance = parseInt(receiverInitialBalance) + transferAmount[0];

    assert.strictEqual(
      initialTHProxyBalance - transferAmount[0],
      parseInt(finalTHProxyBalance),
      `TokenHolder proxy balance is ${finalTHProxyBalance} and expected balance is ${initialTHProxyBalance -
        transferAmount[0]}`
    );

    assert.strictEqual(
      parseInt(finalReceiverBalance),
      expectedReceiverBalance,
      `Receiver account token balance is ${finalReceiverBalance} and expected balance is ${expectedReceiverBalance}`
    );
  });
});
