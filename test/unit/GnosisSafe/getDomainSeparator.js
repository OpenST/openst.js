'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.getDomainSeparator()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const mockGetDomainSeparator = true;
    const getDomainSeparatorSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'domainSeparator',
      sinon.fake.returns({
        call: () => Promise.resolve(mockGetDomainSeparator)
      })
    );
    const response = await gnosisSafe.getDomainSeparator();

    assert.strictEqual(response, mockGetDomainSeparator);
    Spy.assert(getDomainSeparatorSpy, 1, [[]]);
  });
});
