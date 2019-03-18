'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');
const Utils = require('../../../utils/Utils');

describe('TokenHolder.executeRule()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, address);
  });

  it('should construct with correct parameters', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = null;
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    const txOptions = {
      from: '0x0000000000000000000000000000000000000006'
    };

    const mockRawTx = 'mockRawTx';
    const executeRuleRawTx = sinon.replace(tokenHolder, 'executeRuleRawTx', sinon.fake.resolves(mockRawTx));
    const spySendTransaction = sinon.replace(Utils, 'sendTransaction', sinon.fake.resolves(true));
    const response = await tokenHolder.executeRule(to, data, nonce, r, s, v, txOptions);

    assert.isTrue(response, 'executeRule should return true');
    Spy.assert(executeRuleRawTx, 1, [[to, data, nonce, r, s, v]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when txOptions is undefined', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = null;
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    await AssertAsync.reject(tokenHolder.executeRule(to, data, nonce, r, s, v), `Invalid transaction options.`);
  });

  it('should throw an error when txOptions.from is undefined', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = null;
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    await AssertAsync.reject(tokenHolder.executeRule(to, data, nonce, r, s, v, {}), `Invalid from address: undefined.`);
  });
});
