'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');

describe('TokenHolder.getLogoutExecutableData()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, address);
  });

  it('should construct with correct parameters', async () => {
    const mockSessionKeyData = 'mockSessionKeyData';
    const logoutSpy = sinon.replace(
      tokenHolder.contract.methods,
      'sessionKeys',
      sinon.fake.returns({
        call: () => Promise.resolve(mockSessionKeyData)
      })
    );
    const response = await tokenHolder.getSessionKeyData();

    assert.strictEqual(response, mockSessionKeyData);
    Spy.assert(logoutSpy, 1, [[]]);
  });
});
