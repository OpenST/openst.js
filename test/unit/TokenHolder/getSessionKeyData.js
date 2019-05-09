'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');

describe('TokenHolder.getSessionKeyData()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, address);
  });

  it('should create the correct abi encoded data', async () => {
    const sessionKey = '0x0000000000000000000000000000000000000003';

    const mockSessionKeyData = 'mockSessionKeyData';
    const sessionKeyDataSpy = sinon.replace(
      tokenHolder.contract.methods,
      'sessionKeys',
      sinon.fake.returns({
        call: () => Promise.resolve(mockSessionKeyData)
      })
    );
    const response = await tokenHolder.getSessionKeyData(sessionKey);

    assert.strictEqual(response, mockSessionKeyData);
    Spy.assert(sessionKeyDataSpy, 1, [[sessionKey]]);
  });

  it('should throw an error when sessoinKey address is undefined', async () => {
    const sessionKey = undefined;
    await AssertAsync.reject(tokenHolder.getSessionKeyData(sessionKey), `Invalid sessionKey address: undefined.`);
  });
});
