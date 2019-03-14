const Web3 = require('web3');
const { assert } = require('chai');
const Package = require('../../index');

const config = require('../utils/configReader');
const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

const { SetupOpenst } = Package;

let auxiliaryWeb3;
let deployerAddress;
let txOptions;

describe('OpenST Setup', async function() {
  before(async function() {
    const { rpcEndpoint } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpoint);
    const accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    worker = accountsOrigin[1];

    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
  });

  after(() => {
    dockerTeardown();
  });

  it('Performs setup of openst', async function() {
    const {
      tokenHolder,
      gnosisSafe,
      recovery,
      userWalletFactory,
      proxyFactory,
      createAndAddModules
    } = await SetupOpenst(auxiliaryWeb3, txOptions, txOptions, txOptions, txOptions, txOptions, txOptions);
    assert.isNotNull(tokenHolder.address, 'TokenHolder contract address should not be null.');
    assert.isNotNull(gnosisSafe.address, 'GnosisSafe contract address should not be null.');
    assert.isNotNull(recovery.address, 'Recovery contract address should not be null.');
    assert.isNotNull(userWalletFactory.address, 'UserWalletFactory contract address should not be null.');
    assert.isNotNull(proxyFactory.address, 'ProxyFactory contract address should not be null.');
    assert.isNotNull(createAndAddModules.address, 'CreateAndAddModules contract address should not be null.');
  });
});
