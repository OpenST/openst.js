const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index'),
  Mosaic = require('@openstfoundation/mosaic.js');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  RulesSetup = Package.Setup.Rules,
  MockContractsDeployer = require('./../utils/MockContractsDeployer'),
  config = require('../utils/configReader'),
  Contracts = Package.Contracts,
  User = Package.Helpers.User,
  TokenRules = Package.Helpers.TokenRules,
  AbiBinProvider = Package.AbiBinProvider,
  TokenHolder = Package.Helpers.TokenHolder,
  { dockerSetup, dockerTeardown } = require('./../../utils/docker');

const assert = chai.assert,
  abiBinProvider = new AbiBinProvider();

let txOptions,
  ContractsInstance,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  proxyFactoryAddress,
  tokenRulesAddress,
  pricerRuleAddress,
  worker,
  organization,
  mockToken,
  owner = config.deployerAddress,
  tokenHolderSender,
  tokenHolderFirstReceiver,
  tokenHolderSecondReceiver,
  gnosisSafeProxy,
  ephemeralKey,
  mockTokenDeployerInstance,
  tokenRulesObject,
  deployerAddress,
  auxiliaryWeb3;

describe('Direct transfers between TH contracts', async function() {
  before(async function() {
    const { rpcEndpointOrigin } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpointOrigin);
    ContractsInstance = new Contracts(auxiliaryWeb3);
    const accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    worker = accountsOrigin[1];
    owner = accountsOrigin[2];
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async function() {
    const { Organization } = Mosaic.ContractInteract;
    const orgConfig = {
      deployer: deployerAddress,
      owner,
      admin: worker,
      workers: [worker],
      workerExpirationHeight: config.workerExpirationHeight
    };
    const organizationContractInstance = await Organization.setup(auxiliaryWeb3, orgConfig);
    organization = organizationContractInstance.address;
    assert.isNotNull(organization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    mockTokenDeployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);

    await mockTokenDeployerInstance.deployMockToken();

    mockToken = mockTokenDeployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Deploys TokenRules contract', async function() {
    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

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

  it('Registers PricerRule rule', async function() {
    // Only worker can registerRule.
    txOptions.from = worker;

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

  it('Creates first user wallet', async function() {
    txOptions.from = deployerAddress;
    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];

    const owners = [owner],
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

  it('Should create second user wallet', async function() {
    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];

    const owners = [owner],
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

  it('Creates a company wallet', async function() {
    const userInstance = new User(
      null,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[0].address;

    const sessionKeys = [sessionKey];

    const response = await userInstance.createCompanyWallet(
      proxyFactoryAddress,
      thMasterCopyAddress,
      sessionKeys,
      [config.sessionKeySpendingLimit],
      [config.sessionKeyExpirationHeight],
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
    const tokenHolder = new TokenHolder(auxiliaryWeb3, tokenHolderSender);
    // MockToken instance is needed because for transfer. Transfer is not available in Mosaic.ContractInteract.EIP20Token
    // Please update after transfer is exposed in Mosaic.js
    const mockTokenAbi = mockTokenDeployerInstance.abiBinProvider.getABI('MockToken');
    const mockContractInstance = new auxiliaryWeb3.eth.Contract(mockTokenAbi, mockToken, txOptions);

    const eip20Instance = new Mosaic.ContractInteract.EIP20Token(auxiliaryWeb3, mockToken);

    // Funding TH proxy with tokens.
    const amount = config.tokenHolderBalance,
      txObject = mockContractInstance.methods.transfer(tokenHolderSender, amount);
    await txObject.send(txOptions);

    const initialTHProxyBalance = await eip20Instance.balanceOf(tokenHolderSender),
      transferTos = [tokenHolderFirstReceiver, tokenHolderSecondReceiver],
      firstReceiverInitialBalance = await eip20Instance.balanceOf(tokenHolderFirstReceiver),
      secondReceiverInitialBalance = await eip20Instance.balanceOf(tokenHolderSecondReceiver),
      transferAmounts = [20, 10];

    const directTransferExecutable = tokenRulesObject.getDirectTransferExecutableData(transferTos, transferAmounts),
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

    await tokenHolder.executeRule(tokenRulesAddress, directTransferExecutable, nonce, vrs.r, vrs.s, vrs.v, txOptions);

    const finalTHProxyBalance = await eip20Instance.balanceOf(tokenHolderSender),
      firstReceiverFinalBalance = await eip20Instance.balanceOf(tokenHolderFirstReceiver),
      secondReceiverFinalBalance = await eip20Instance.balanceOf(tokenHolderSecondReceiver),
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
