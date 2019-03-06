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

'use strict';

const { assert } = require('chai');
const EthUtils = require('ethereumjs-util');
const Web3 = require('web3');

const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

const config = require('../utils/configReader');

const Mosaic = require('@openstfoundation/mosaic.js');
const ConfigReader = require('../utils/configReader');
const UserSetup = require('../../lib/setup/User.js');
const User = require('../../lib/helper/User.js');
const MockContractsDeployer = require('../utils/MockContractsDeployer.js');
const TokenRulesSetup = require('../../lib/setup/TokenRules.js');
const AbiBinProvider = require('../../lib/AbiBinProvider.js');

const abiBinProvider = new AbiBinProvider();

const GNOSIS_SAFE_CONTRACT_NAME = 'GnosisSafe';
const DELAYED_RECOVERY_MODULE_CONTRACT_NAME = 'DelayedRecoveryModule';

class WalletProvider {
  async init(walletCount) {
    const wallets = await auxiliaryWeb3.eth.accounts.wallet;

    this.index = wallets.length;
    this.walletCount = walletCount;

    await auxiliaryWeb3.eth.accounts.wallet.create(this.index + this.walletCount);

    this.wallets = await auxiliaryWeb3.eth.accounts.wallet;
  }

  get() {
    const wallet = this.wallets[this.index];
    this.index += 1;
    return wallet;
  }

  getAddress() {
    const wallet = this.get();
    return wallet.address;
  }
}

let auxiliaryWeb3 = {};
let walletProvider = {};
let userFactory = {};
let deployerAddress = '';
let recoveryControllerAddress = '';

async function createUserWallet(
  userFactoryInstance,
  owners,
  threshold,
  recoveryOwnerAddress,
  recoveryControllerAddress,
  recoveryBlockDelay
) {
  const txOptions = {
    from: deployerAddress,
    gasPrice: ConfigReader.gasPrice,
    gas: ConfigReader.gas
  };

  const createUserWalletTxResponse = await userFactoryInstance.createUserWallet(
    owners,
    threshold,
    recoveryOwnerAddress,
    recoveryControllerAddress,
    recoveryBlockDelay,
    [],
    [],
    [],
    txOptions
  );

  const { returnValues } = createUserWalletTxResponse.events.UserWalletCreated;
  const userWalletEvent = JSON.parse(JSON.stringify(returnValues));

  const tokenHolderProxyAddress = userWalletEvent._tokenHolderProxy;
  const gnosisSafeProxyAddress = userWalletEvent._gnosisSafeProxy;

  return {
    tokenHolderProxyAddress,
    gnosisSafeProxyAddress
  };
}

function instantiateGnosisSafeProxy(gnosisSafeProxyAddress) {
  const gnosisSafeAbi = abiBinProvider.getABI(GNOSIS_SAFE_CONTRACT_NAME);

  const gnosisSafeProxy = new auxiliaryWeb3.eth.Contract(gnosisSafeAbi, gnosisSafeProxyAddress);

  return gnosisSafeProxy;
}

function instantiateRecoveryModuleProxy(recoveryModuleAddressProxy) {
  const recoveryModuleAbi = abiBinProvider.getABI(DELAYED_RECOVERY_MODULE_CONTRACT_NAME);

  const recoveryModule = new auxiliaryWeb3.eth.Contract(recoveryModuleAbi, recoveryModuleAddressProxy);

  return recoveryModule;
}

function hashRecoveryModuleDomainSeparator(recoveryModuleAddress) {
  const RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH = auxiliaryWeb3.utils.keccak256(
    'EIP712Domain(address verifyingContract)'
  );

  return auxiliaryWeb3.utils.keccak256(
    auxiliaryWeb3.eth.abi.encodeParameters(
      ['bytes32', 'address'],
      [RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH, recoveryModuleAddress]
    )
  );
}

function hashRecoveryModuleRecoveryStruct(structTypeHash, prevOwner, oldOwner, newOwner) {
  return auxiliaryWeb3.utils.keccak256(
    auxiliaryWeb3.eth.abi.encodeParameters(
      ['bytes32', 'address', 'address', 'address'],
      [structTypeHash, prevOwner, oldOwner, newOwner]
    )
  );
}

function hashRecoveryModuleRecovery(recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner) {
  const recoveryStructHash = hashRecoveryModuleRecoveryStruct(structTypeHash, prevOwner, oldOwner, newOwner);

  const domainSeparatorHash = hashRecoveryModuleDomainSeparator(recoveryModuleAddress);

  return auxiliaryWeb3.utils.soliditySha3(
    { t: 'bytes1', v: '0x19' },
    { t: 'bytes1', v: '0x01' },
    { t: 'bytes32', v: domainSeparatorHash },
    { t: 'bytes32', v: recoveryStructHash }
  );
}

function signRecovery(recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey) {
  const recoveryHash = hashRecoveryModuleRecovery(recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner);

  const signature = EthUtils.ecsign(EthUtils.toBuffer(recoveryHash), EthUtils.toBuffer(recoveryOwnerPrivateKey));

  return {
    recoveryHash,
    signature
  };
}

function signInitiateRecovery(recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey) {
  const INITIATE_RECOVERY_STRUCT_TYPEHASH = auxiliaryWeb3.utils.keccak256(
    'InitiateRecoveryStruct(address prevOwner,address oldOwner,address newOwner)'
  );

  return signRecovery(
    recoveryModuleAddress,
    INITIATE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryOwnerPrivateKey
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitBlockNumber(blockNumber) {
  let currentBlockNumber = await auxiliaryWeb3.eth.getBlockNumber();

  while (currentBlockNumber < blockNumber) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
    currentBlockNumber = await auxiliaryWeb3.eth.getBlockNumber();
  }
}

async function initiateAndExecuteRecovery(
  userFactoryInstance,
  owners,
  threshold,
  recoveryOwner,
  recoveryControllerAddress,
  recoveryBlockDelay,
  prevOwnerAddress,
  oldOwnerAddress,
  newOwnerAddress
) {
  const { gnosisSafeProxyAddress } = await createUserWallet(
    userFactoryInstance,
    owners,
    threshold,
    recoveryOwner.address,
    recoveryControllerAddress,
    recoveryBlockDelay
  );

  const gnosisSafeProxy = instantiateGnosisSafeProxy(gnosisSafeProxyAddress);

  const txOptions = {
    from: deployerAddress,
    gasPrice: ConfigReader.gasPrice,
    gas: ConfigReader.gas
  };

  const modules = await gnosisSafeProxy.methods.getModules().call(txOptions);

  assert.strictEqual(modules.length, 1);

  const recoveryModuleProxyAddress = modules[0];

  const recoveryModule = instantiateRecoveryModuleProxy(recoveryModuleProxyAddress);

  const { signature } = signInitiateRecovery(
    recoveryModuleProxyAddress,
    prevOwnerAddress,
    oldOwnerAddress,
    newOwnerAddress,
    recoveryOwner.privateKey
  );

  await recoveryModule.methods
    .initiateRecovery(
      prevOwnerAddress,
      oldOwnerAddress,
      newOwnerAddress,
      EthUtils.bufferToHex(signature.r),
      EthUtils.bufferToHex(signature.s),
      signature.v
    )
    .send({
      from: recoveryControllerAddress,
      gasPrice: ConfigReader.gasPrice,
      gas: ConfigReader.gas
    });

  const blockNumber = await auxiliaryWeb3.eth.getBlockNumber();

  await waitBlockNumber(blockNumber + recoveryBlockDelay);

  await recoveryModule.methods.executeRecovery(prevOwnerAddress, oldOwnerAddress, newOwnerAddress).send({
    from: recoveryControllerAddress,
    gasPrice: ConfigReader.gasPrice,
    gas: ConfigReader.gas
  });

  return gnosisSafeProxy;
}

describe('Delayed Recovery', async () => {
  before(async () => {
    const { rpcEndpoint } = await dockerSetup();

    auxiliaryWeb3 = new Web3(rpcEndpoint);

    const accountsOrigin = await auxiliaryWeb3.eth.getAccounts();

    recoveryControllerAddress = accountsOrigin[0];
    deployerAddress = accountsOrigin[1];

    walletProvider = new WalletProvider();
    await walletProvider.init(50);

    const organizationWorkerAddress = walletProvider.getAddress();

    const userSetup = new UserSetup(auxiliaryWeb3);

    const txOptions = {
      from: deployerAddress,
      gasPrice: ConfigReader.gasPrice,
      gas: ConfigReader.gas
    };

    const proxyFactoryDeployTxResponse = await userSetup.deployProxyFactory(txOptions);
    const proxyFactoryAddress = proxyFactoryDeployTxResponse.receipt.contractAddress;

    const userWalletFactoryDeployTxResponse = await userSetup.deployUserWalletFactory(txOptions);
    const userWalletFactoryAddress = userWalletFactoryDeployTxResponse.receipt.contractAddress;

    const gnosisSafeMasterCopyDeployTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    const gnosisSafeMasterCopyAddress = gnosisSafeMasterCopyDeployTxResponse.receipt.contractAddress;

    const createAndAddModulesDeployTxResponse = await userSetup.deployCreateAndAddModules(txOptions);
    const createAndAddModulesAddress = createAndAddModulesDeployTxResponse.receipt.contractAddress;

    const delayedRecoveryModuleMasterCopyDeployTxResponse = await userSetup.deployDelayedRecoveryModuleMasterCopy(
      txOptions
    );
    const delayedRecoveryModuleMasterCopyAddress =
      delayedRecoveryModuleMasterCopyDeployTxResponse.receipt.contractAddress;

    const mockTokenDeployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);
    await mockTokenDeployerInstance.deployMockToken(auxiliaryWeb3, txOptions);
    const mockToken = mockTokenDeployerInstance.addresses.MockToken;

    const organizationOwnerAddress = deployerAddress;
    const { Organization } = Mosaic.ContractInteract;
    const orgConfig = {
      deployer: deployerAddress,
      owner: organizationOwnerAddress,
      admin: organizationWorkerAddress,
      workers: [organizationWorkerAddress],
      workerExpirationHeight: config.workerExpirationHeight
    };
    const organizationContractInstance = await Organization.setup(auxiliaryWeb3, orgConfig);
    const organizationAddress = organizationContractInstance.address;
    assert.isNotNull(organizationAddress, 'Organization contract address should not be null.');

    const tokenRulesSetup = await new TokenRulesSetup(auxiliaryWeb3);
    const tokenRulesDeployTxResponse = await tokenRulesSetup.deploy(organizationAddress, mockToken, txOptions);
    const tokenRulesAddress = tokenRulesDeployTxResponse.receipt.contractAddress;

    const tokenHolderMasterCopyDeployTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    const tokenHolderMasterCopyAddress = tokenHolderMasterCopyDeployTxResponse.receipt.contractAddress;

    userFactory = new User(
      tokenHolderMasterCopyAddress,
      gnosisSafeMasterCopyAddress,
      delayedRecoveryModuleMasterCopyAddress,
      createAndAddModulesAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      proxyFactoryAddress,
      auxiliaryWeb3
    );
  });

  after(() => {
    dockerTeardown();
  });

  it('Initiates recovery, waits required block number to proceed, executes.', async () => {
    const txOptions = {
      from: deployerAddress,
      gasPrice: ConfigReader.gasPrice,
      gas: ConfigReader.gas
    };

    const ownerAddress1 = walletProvider.getAddress();
    const ownerAddress2 = walletProvider.getAddress();
    const ownerAddress3 = walletProvider.getAddress();

    const threshold = 1;

    const recoveryOwner = walletProvider.get();
    const recoveryBlockDelay = 5;

    const newOwnerAddress = walletProvider.getAddress();

    const owners = [ownerAddress1, ownerAddress2, ownerAddress3];

    const gnosisSafeProxy = await initiateAndExecuteRecovery(
      userFactory,
      owners,
      threshold,
      recoveryOwner,
      recoveryControllerAddress,
      recoveryBlockDelay,
      ownerAddress1, // prev owner
      ownerAddress2, // old owner
      newOwnerAddress
    );

    assert.isOk(await gnosisSafeProxy.methods.isOwner(ownerAddress1).call(txOptions));
    assert.isOk(await gnosisSafeProxy.methods.isOwner(ownerAddress3).call(txOptions));
    assert.isOk(await gnosisSafeProxy.methods.isOwner(newOwnerAddress).call(txOptions));

    assert.isNotOk(await gnosisSafeProxy.methods.isOwner(ownerAddress2).call(txOptions));
  });
});
