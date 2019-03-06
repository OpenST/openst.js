'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getRemoveOwnerWithThresholdExecutableData()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const owner = '0x0000000000000000000000000000000000000004';
    const threshold = 1;

    const mockRemoveOwnerWithThreshold = 'mockRemoveOwnerWithThreshold';
    const removeOwnerWithThresholdSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'removeOwner',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockRemoveOwnerWithThreshold)
      })
    );
    const response = await gnosisSafe.getRemoveOwnerWithThresholdExecutableData(prevOwner, owner, threshold);

    assert.strictEqual(response, mockRemoveOwnerWithThreshold);
    Spy.assert(removeOwnerWithThresholdSpy, 1, [[prevOwner, owner, threshold]]);
  });
});
