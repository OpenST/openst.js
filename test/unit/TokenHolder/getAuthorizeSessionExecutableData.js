'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');

describe('TokenHolder.getAuthorizeSessionWithExecutableData()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, address);
  });

  it('should construct with correct parameters', async () => {
    const sessionKey = '0x0000000000000000000000000000000000000003';
    const spendingLimit = 10000000000;
    const expirationHeight = 2000000000;

    const mockAuthorizeSession = 'mockAuthorizeSession';
    const authorizeSessionSpy = sinon.replace(
      tokenHolder.contract.methods,
      'authorizeSession',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockAuthorizeSession)
      })
    );
    const response = await tokenHolder.getAuthorizeSessionExecutableData(sessionKey, spendingLimit, expirationHeight);

    assert.strictEqual(response, mockAuthorizeSession);
    Spy.assert(authorizeSessionSpy, 1, [[sessionKey, spendingLimit, expirationHeight]]);
  });
});
