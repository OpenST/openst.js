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

const assert = require('chai').assert;
const EthUtils = require('ethereumjs-util');
const Web3 = require('web3');

const Mosaic = require('@openstfoundation/mosaic-tbd');
const ConfigReader = require('../utils/configReader');
const UserSetup = require('../../lib/setup/User.js');
const User = require('../../lib/helper/User.js');
const MockContractsDeployer = require('../utils/MockContractsDeployer.js');
const TokenRulesSetup = require('../../lib/setup/TokenRules.js');
const Web3WalletHelper = require('../utils/Web3WalletHelper.js');
const AbiBinProvider = require('../../lib/AbiBinProvider.js');

const { OrganizationHelper } = Mosaic.ChainSetup;

const auxiliaryWeb3 = new Web3(ConfigReader.gethRpcEndPoint);
const abiBinProvider = new AbiBinProvider();

const RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH = auxiliaryWeb3.utils.keccak256(
  'EIP712Domain(address delayedRecoveryModule)'
);

const INITIATE_RECOVERY_STRUCT_TYPEHASH = auxiliaryWeb3.utils.keccak256(
  'InitiateRecoveryStruct(address prevOwner,address oldOwner,address newOwner)'
);

const EXECUTE_RECOVERY_STRUCT_TYPEHASH = auxiliaryWeb3.utils.keccak256(
  'ExecuteRecoveryStruct(address prevOwner,address oldOwner,address newOwner)'
);

const GNOSIS_SAFE_CONTRACT_NAME = 'GnosisSafe';
const DELAYED_RECOVERY_MODULE_CONTRACT_NAME = 'DelayedRecoveryModule';

class WalletProvider {
  constructor(wallets) {
    this.wallets = wallets;
    this.index = 1;
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

let walletProvider = {};
let userFactory = {};

async function createUserWallet(
  userFactoryInstance,
  owners,
  threshold,
  recoveryOwnerAddress,
  recoveryControllerAddress,
  recoveryBlockDelay
) {
  const txOptions = {
    from: ConfigReader.deployerAddress,
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
  return signRecovery(
    recoveryModuleAddress,
    INITIATE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryOwnerPrivateKey
  );
}

function signExecuteRecovery(recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey) {
  return signRecovery(
    recoveryModuleAddress,
    EXECUTE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryOwnerPrivateKey
  );
}

function advanceBlock() {
  return new Promise((resolve, reject) => {
    auxiliaryWeb3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: new Date().getTime()
      },
      (err) => {
        if (err) {
          return reject(err);
        }

        const newBlockHash = auxiliaryWeb3.eth.getBlock('latest').hash;

        return resolve(newBlockHash);
      }
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitBlockNumber(blockNumber) {
  let currentBlockNumber = await auxiliaryWeb3.eth.getBlockNumber();

  while (currentBlockNumber < blockNumber) {
    await sleep(2000);
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
    from: ConfigReader.deployerAddress,
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
    const web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3);
    await web3WalletHelper.init(auxiliaryWeb3);
    const wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    walletProvider = new WalletProvider(wallets);

    const organizationWorkerAddress = walletProvider.getAddress();

    const userSetup = new UserSetup(auxiliaryWeb3);

    const txOptions = {
      from: ConfigReader.deployerAddress,
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

    const mockTokenDeployerInstance = new MockContractsDeployer(ConfigReader.deployerAddress, auxiliaryWeb3);
    await mockTokenDeployerInstance.deployMockToken();
    const mockToken = mockTokenDeployerInstance.addresses.MockToken;

    const organizationOwnerAddress = ConfigReader.deployerAddress;
    const orgHelper = new OrganizationHelper(auxiliaryWeb3, null);
    const orgConfig = {
      deployer: ConfigReader.deployerAddress,
      owner: organizationOwnerAddress,
      workers: organizationWorkerAddress,
      workerExpirationHeight: '20000000'
    };
    await orgHelper.setup(orgConfig);
    const organizationAddress = orgHelper.address;

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

  it('Initiates recovery, waits required block number to proceed, executes.', async () => {
    const txOptions = {
      from: ConfigReader.deployerAddress,
      gasPrice: ConfigReader.gasPrice,
      gas: ConfigReader.gas
    };

    const ownerAddress1 = walletProvider.getAddress();
    const ownerAddress2 = walletProvider.getAddress();
    const ownerAddress3 = walletProvider.getAddress();

    const threshold = 1;

    const recoveryOwner = walletProvider.get();
    const recoveryControllerAddress = ConfigReader.recoveryControllerAddress;
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
