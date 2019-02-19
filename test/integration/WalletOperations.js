const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index'),
  abiDecoder = require('abi-decoder'),
  MockContractsDeployer = require('../utils/MockContractsDeployer'),
  Mosaic = require('@openstfoundation/mosaic-tbd'),
  config = require('../utils/configReader');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  Contracts = Package.Contracts,
  User = Package.Helpers.User,
  AbiBinProvider = Package.AbiBinProvider,
  TokenHolder = Package.Helpers.TokenHolder,
  GnosisSafe = Package.Helpers.GnosisSafe;

const assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper,
  abiBinProvider = new AbiBinProvider();

const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

let auxiliaryWeb3,
  ContractsInstance,
  deployerAddress,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  tokenRulesAddress,
  worker,
  organization,
  mockToken,
  owner,
  tokenHolderProxy,
  gnosisSafeProxy,
  ephemeralKey,
  deployerInstance,
  tokenRules,
  gnosisSafeProxyInstance,
  txOptions,
  tokenHolderInstance;

describe('Wallet operations', async function() {
  before(async function() {
    const { rpcEndpointOrigin } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpointOrigin);
    ContractsInstance = new Contracts(auxiliaryWeb3);
    const accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    worker = accountsOrigin[1];
    owner = accountsOrigin[2];

    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
  });

  after(() => {
    dockerTeardown();
  });

  it('Should deploy Organization contract', async function() {
    let orgHelper = new OrganizationHelper(auxiliaryWeb3, null);
    const orgConfig = {
      deployer: deployerAddress,
      owner: owner,
      workers: worker,
      workerExpirationHeight: '20000000'
    };

    await orgHelper.setup(orgConfig);
    organization = orgHelper.address;

    assert.isNotNull(organization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    deployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);

    await deployerInstance.deployMockToken();

    mockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Should deploy TokenRules contract', async function() {
    tokenRules = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, mockToken, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;
    const openstContracts = new Contracts(auxiliaryWeb3);

    let contractInstance = openstContracts.TokenRules(response.receipt.contractAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await contractInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await contractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Should deploy Gnosis MultiSig MasterCopy contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
  });

  it('Should deploy TokenHolder MasterCopy contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
  });

  it('Should deploy UserWalletFactory contract', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
  });

  // // wallet3, wallet9 are the owners.
  // wallet1 and wallet2 are the owners.
  it('Should create a user wallet', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(3);

    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];

    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    const owners = [auxiliaryWeb3.eth.accounts.wallet[1].address, auxiliaryWeb3.eth.accounts.wallet[2].address],
      threshold = 1,
      sessionKeys = [ephemeralKey.address],
      sessionKeysSpendingLimits = [config.sessionKeySpendingLimit],
      sessionKeysExpirationHeights = [config.sessionKeyExpirationHeight];

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

  // wallet1 and wallet2 are the owners.
  // // After AddWallet wallet1, wallet2, wallet3 are the owners.
  it('Should add wallet', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(1);

    gnosisSafeProxyInstance = new GnosisSafe(gnosisSafeProxy, auxiliaryWeb3);

    const ownerToAdd = auxiliaryWeb3.eth.accounts.wallet[3],
      currentOwner = auxiliaryWeb3.eth.accounts.wallet[1],
      threshold = 1,
      ownerToAddWithThresholdExData = gnosisSafeProxyInstance.getAddOwnerWithThresholdExecutableData(
        ownerToAdd.address,
        threshold
      );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      ownerToAddWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);

    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      ownerToAddWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const returnValues = result.events.AddedOwner.returnValues;
    const addedOwnerEvent = JSON.parse(JSON.stringify(returnValues));

    // Verifying added owner.
    assert.strictEqual(addedOwnerEvent.owner, ownerToAdd.address, 'Incorrect owner added');
  });

  // wallet1, wallet2, wallet3 are the owners.
  // After ReplaceWallet wallet2, wallet3, wallet4 are the owners.
  it('Should replace wallet', async function() {
    const owners = await gnosisSafeProxyInstance.getOwners();
    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    const newOwner = auxiliaryWeb3.eth.accounts.wallet[4],
      currentOwner = auxiliaryWeb3.eth.accounts.wallet[1],
      previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, currentOwner.address),
      swapOwnerExData = gnosisSafeProxyInstance.getSwapOwnerExecutableData(
        previousOwner, // previous owner.
        currentOwner.address, // owner to be replaced
        newOwner.address // new owner
      );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      swapOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      swapOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const addedOwnerReturnValues = result.events.AddedOwner.returnValues;
    const addedOwnerEvent = JSON.parse(JSON.stringify(addedOwnerReturnValues));

    const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
    const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));

    assert.strictEqual(addedOwnerEvent.owner, newOwner.address, 'Incorrect owner added');
    assert.strictEqual(removedOwnerEvent.owner, currentOwner.address, 'Incorrect owner removed');
  });

  // // wallet2, wallet3, wallet4 are the owners.
  // After RemoveWallet wallet2, wallet4 are the owners.
  it('Should remove wallet', async function() {
    const removeOwner = auxiliaryWeb3.eth.accounts.wallet[3],
      owner = auxiliaryWeb3.eth.accounts.wallet[2];

    const owners = await gnosisSafeProxyInstance.getOwners();
    const previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, removeOwner.address);

    const removeOwnerExData = gnosisSafeProxyInstance.getRemoveOwnerExecutableData(
      previousOwner, // previous owner.
      removeOwner.address, // owner to be removed.
      1 // threshold
    );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      removeOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSig1 = await owner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      removeOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSig1.signature,
      txOptions
    );

    const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
    const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));

    assert.strictEqual(removedOwnerEvent.owner, removeOwner.address, 'Incorrect removed owner address');
  });

  // wallet2, wallet4 are the owners.
  it('Should authorize session', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    tokenHolderInstance = new TokenHolder(auxiliaryWeb3, tokenRulesAddress, tokenHolderProxy);
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[5].address;
    const spendingLimit = config.sessionKeySpendingLimit;
    const expirationHeight = config.sessionKeyExpirationHeight;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const authorizeSessionExData = tokenHolderInstance.getAuthorizeSessionExecutableData(
      sessionKey,
      spendingLimit,
      expirationHeight
    );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      authorizeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      authorizeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionAuthorized = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionAuthorized[0].name, 'SessionAuthorized', 'Event name not as expected ');
    assert.strictEqual(
      auxiliaryWeb3.utils.toChecksumAddress(sessionAuthorized[0].events[0].value),
      auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
      'Session key is not authorized'
    );
  });

  // wallet2, wallet4 are the owners.
  it('Should revoke session', async function() {
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[5].address;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const revokeSessionExData = tokenHolderInstance.getRevokeSessionExecutableData(sessionKey);

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      revokeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      revokeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionRevoked = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionRevoked[0].name, 'SessionRevoked', 'Event name not as expected ');
    assert.strictEqual(
      auxiliaryWeb3.utils.toChecksumAddress(sessionRevoked[0].events[0].value),
      auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
      'Session key revoked is incorrect'
    );
  });

  // wallet2, wallet4 are the owners.
  it('Should logout all authorized sessions', async function() {
    const tokenHolderInstance = new TokenHolder(auxiliaryWeb3, tokenHolderProxy);
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const logoutExData = tokenHolderInstance.getLogoutExecutableData();

    const nonce = await gnosisSafeProxyInstance.getNonce();

    const safeTxData = await gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      logoutExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      logoutExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionsLoggedOutEvent = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionsLoggedOutEvent[0].name, 'SessionsLoggedOut', 'Incorrect event emitted');
    assert.strictEqual(sessionsLoggedOutEvent[0].events[0].value, '2', 'Incorrect sessionwindow value');
  });

  // wallet2, wallet4 are the owners.
  it('Should change required threshold', async function() {
    // Owners already added should be equal or less than the threshold limit.
    const newThreshold = 2;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const changeThresholdExecutableData = gnosisSafeProxyInstance.getChangeThresholdExecutableData(newThreshold);

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      changeThresholdExecutableData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      changeThresholdExecutableData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const changeThresholdReturnValues = result.events.ChangedThreshold.returnValues;
    const changeThresholdEvent = JSON.parse(JSON.stringify(changeThresholdReturnValues));

    assert.strictEqual(
      changeThresholdEvent.threshold.toString(),
      newThreshold.toString(),
      'Expected threshold was not set'
    );
  });
});
