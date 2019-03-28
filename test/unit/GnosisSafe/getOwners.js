'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getOwners()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const mockGetOwners = true;
    const getOwnersSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'getOwners',
      sinon.fake.returns({
        call: () => Promise.resolve(mockGetOwners)
      })
    );
    const response = await gnosisSafe.getOwners();

    assert.strictEqual(response, mockGetOwners);
    Spy.assert(getOwnersSpy, 1, [[]]);
  });
});
