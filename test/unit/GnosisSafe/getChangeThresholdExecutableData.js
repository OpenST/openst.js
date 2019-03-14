'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getChangeThresholdExecutableData()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const threshold = 1;

    const mockChangeThreshold = 'mockChangeThreshold';
    const changeThresholdSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'changeThreshold',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockChangeThreshold)
      })
    );
    const response = await gnosisSafe.getChangeThresholdExecutableData(threshold);

    assert.strictEqual(response, mockChangeThreshold);
    Spy.assert(changeThresholdSpy, 1, [[threshold]]);
  });
});
