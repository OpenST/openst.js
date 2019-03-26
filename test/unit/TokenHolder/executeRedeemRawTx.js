'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');

describe('TokenHolder.executeRedemptionRawTx()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const tokenHolderAddress = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, tokenHolderAddress);
  });

  it('should construct with correct parameters', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = 'cogatewayRedeem';
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    const mockExecuteRedeem = 'mockExecuteRedeem';
    const executeRedeemSpy = sinon.replace(
      tokenHolder.contract.methods,
      'executeRedemption',
      sinon.fake.resolves(mockExecuteRedeem)
    );
    const response = await tokenHolder.executeRedemptionRawTx(to, data, nonce, r, s, v);

    assert.strictEqual(response, mockExecuteRedeem);
    Spy.assert(executeRedeemSpy, 1, [[to, data, nonce, r, s, v]]);
    sinon.restore();
  });

  it('should throw an error when to address is undefined', async () => {
    const to = undefined;
    const data = 'cogatewayRedeem';
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    await AssertAsync.reject(
      tokenHolder.executeRedemptionRawTx(to, data, nonce, r, s, v),
      `Invalid to address: undefined.`
    );
  });

  it('should throw an error when data is undefined', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = undefined;
    const nonce = 1;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    await AssertAsync.reject(tokenHolder.executeRedemptionRawTx(to, data, nonce, r, s, v), `Invalid data: undefined.`);
  });

  it('should throw an error when nonce is undefined', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const data = 'cogatewayRedeem';
    const nonce = undefined;
    const r = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1760';
    const s = '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c1';
    const v = 28;
    await AssertAsync.reject(tokenHolder.executeRedemptionRawTx(to, data, nonce, r, s, v), `Invalid nonce: undefined.`);
  });
});
