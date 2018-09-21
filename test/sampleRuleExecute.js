/**
 * Sample Rule Execute
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert;

const configReader = require('./utils/configReader'),
  abis = require('./utils/abis'),
  fs = require('fs');

const gethEndpoint = 'http://127.0.0.1:8545';

let deployerAddress,
  organizationAddress,
  wallet1,
  wallet2,
  ephemeralKey,
  facilitatorAddress,
  passphrase,
  gasPrice,
  gasLimit,
  mockTokenAbi,
  openST;

// Load cache service
describe('test/sampleRuleExecute', function() {

  before(async function() {

    deployerAddress = configReader.deployerAddress;
    organizationAddress = configReader.organizationAddress;
    wallet1 = configReader.wallet1;
    wallet2 = configReader.wallet2;
    ephemeralKey = configReader.ephemeralKey;
    facilitatorAddress = configReader.facilitatorAddress;
    passphrase = configReader.passphrase;
    gasPrice = configReader.gasPrice;
    gasLimit = configReader.gasLimit;

    mockTokenAbi = abis.mockToken;

    // Creating object of OpenST
    const OpenST = require('../index.js');
    openST = new OpenST(gethEndpoint);

    // erc20 contract deploy



  });

  it('should pass as it is a simple sample test', async function() {
    console.log('hello world!');
    assert.equal(true, true);
  });
});
