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
    const mockGetModules = true;
    const getModulesSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'getModules',
      sinon.fake.returns({
        call: () => Promise.resolve(mockGetModules)
      })
    );
    const response = await gnosisSafe.getModules();

    assert.strictEqual(response, mockGetModules);
    Spy.assert(getModulesSpy, 1, [[]]);
  });
});
