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
  AbiBinProvider = Package.AbiBinProvider;

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  ContractsInstance = new Contracts(auxiliaryWeb3),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper,
  abiBinProvider = new AbiBinProvider(),
  bytesBaseCurrencyCode = auxiliaryWeb3.utils.stringToHex(config.baseCurrencyCode.toString()),
  conversionRate = 2,
  conversionRateDecimals = 18,
  requiredPriceOracleDecimals = 18;

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
  mockToken,
  owner = config.deployerAddress,
  tokenHolderProxy,
  gnosisSafeProxy;

describe('ExecuteRule', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
  });

  it('Should deploy Organization contract', async function() {
    //this.timeout(60000);
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
    //this.timeout(60000);
    const deployerInstance = new MockContractsDeployer(config.deployerAddress, auxiliaryWeb3);

    await deployerInstance.deployMockToken();

    mockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(60000);

    const tokenRules = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, mockToken, txOptions);
    tokenRulesAddress = response.receipt.contractAddress;

    let tokenRulesInstance = ContractsInstance.TokenRules(tokenRulesAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await tokenRulesInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await tokenRulesInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Should deploy Gnosis MultiSig MasterCopy contract', async function() {
    // this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
  });

  it('Should deploy TokenHolder MasterCopy contract', async function() {
    //this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
  });

  it('Should deploy UserWalletFactory contract', async function() {
    //this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
  });

  it('Should deploy PricerRule contract', async function() {
    // this.timeout(60000);

    const rulesSetup = new RulesSetup(auxiliaryWeb3, organization, mockToken, tokenRulesAddress);
    const pricerRulesDeployResponse = await rulesSetup.deployPricerRule(
      bytesBaseCurrencyCode,
      conversionRate,
      conversionRateDecimals,
      requiredPriceOracleDecimals,
      txOptions
    );
    assert.strictEqual(pricerRulesDeployResponse.receipt.status, true);
    pricerRuleAddress = pricerRulesDeployResponse.receipt.contractAddress;
    const priceRuleInstance = ContractsInstance.PricerRule(pricerRuleAddress, txOptions);
    // Sanity check
    assert.strictEqual(
      await priceRuleInstance.methods.tokenRules().call(),
      tokenRulesAddress,
      'TokenRules address is incorrect!'
    );
  });

  it('Should register PricerRule rule', async function() {
    //this.timeout(3 * 60000);

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

  it('Should create a user wallet', async function() {
    //this.timeout(3 * 60000);

    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    const owners = [wallets[3].address],
      threshold = 1,
      sessionKeys = [wallets[5].address],
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
});
