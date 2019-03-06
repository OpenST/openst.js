'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getSwapOwnerExecutableData()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';

    const mockSwapOwner = 'mockSwapOwner';
    const swapOwnerSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'swapOwner',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockSwapOwner)
      })
    );
    const response = await gnosisSafe.getSwapOwnerExecutableData(prevOwner, oldOwner, newOwner);

    assert.strictEqual(response, mockSwapOwner);
    Spy.assert(swapOwnerSpy, 1, [[prevOwner, oldOwner, newOwner]]);
  });
});
