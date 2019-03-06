'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const Recovery = require('../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../utils/AssertAsync');
const Utils = require('../../utils/Utils');
const Contracts = require('../../lib/Contracts');

describe('Recovery.constructor()', () => {
  let web3;
  let recoveryAddress;

  beforeEach(() => {
    web3 = new Web3();
    recoveryAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should construct with correct parameter', async () => {
    const fakeInstance = sinon.fake();
    const spyContract = sinon.replace(Contracts, 'getDelayedRecovery', sinon.fake.returns(fakeInstance));

    const instance = new Recovery(web3, recoveryAddress);

    assert.strictEqual(recoveryAddress, instance.address, 'Address must match');

    assert.strictEqual(web3, instance.auxiliaryWeb3, 'Web3 instance must match');
    Spy.assert(spyContract, 1, [[web3, recoveryAddress]]);
    sinon.restore();
  });

  it('should throw an error when getDelayedRecovery returns undefined object', async () => {
    const spyContract = sinon.replace(Contracts, 'getDelayedRecovery', sinon.fake.returns(undefined));

    const errorMessage = `Could not load recovery contract for: ${recoveryAddress}`;
    await AssertAsync.reject(new Recovery(web3, recoveryAddress), errorMessage);

    Spy.assert(spyContract, 1, [[web3, recoveryAddress]]);
    sinon.restore();
  });

  it('should throw an error when web3 object is undefined', async () => {
    await AssertAsync.reject(
      new Recovery(undefined, recoveryAddress),
      `Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.`
    );
  });

  it('should throw an error when recovery contract address is undefined', async () => {
    await AssertAsync.reject(
      new Recovery(web3, undefined),
      `Mandatory Parameter 'address' is missing or invalid: undefined.`
    );
  });
});
