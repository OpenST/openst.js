'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getModules()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const mockGetNonce = true;
    const getNonceSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'nonce',
      sinon.fake.returns({
        call: () => Promise.resolve(mockGetNonce)
      })
    );
    const response = await gnosisSafe.getNonce();

    assert.strictEqual(response, mockGetNonce);
    Spy.assert(getNonceSpy, 1, [[]]);
  });
});
