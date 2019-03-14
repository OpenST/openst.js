'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getAddOwnerWithThresholdExecutableData()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const owner = '0x0000000000000000000000000000000000000003';
    const threshold = 1;

    const mockAddOwnerWithThreshold = 'mockAddOwnerWithThreshold';
    const addOwnerWithThresholdSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'addOwnerWithThreshold',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockAddOwnerWithThreshold)
      })
    );
    const response = await gnosisSafe.getAddOwnerWithThresholdExecutableData(owner, threshold);

    assert.strictEqual(response, mockAddOwnerWithThreshold);
    Spy.assert(addOwnerWithThresholdSpy, 1, [[owner, threshold]]);
  });
});
