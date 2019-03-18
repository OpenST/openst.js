'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const Recovery = require('../../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../../utils/AssertAsync');
const Utils = require('../../../utils/Utils');

describe('Recovery.resetRecoveryByOwner()', () => {
  let recovery;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const recoveryAddress = '0x0000000000000000000000000000000000000002';
    recovery = new Recovery(web3, recoveryAddress);
  });

  it('should pass with correct params', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = 's';

    const mockRawTx = 'mockRawTx';

    const rawTx = sinon.replace(recovery, 'resetRecoveryOwnerRawTx', sinon.fake.resolves(mockRawTx));

    const spySendTransaction = sinon.replace(Utils, 'sendTransaction', sinon.fake.resolves(true));
    const txOptions = {
      from: '0x0000000000000000000000000000000000000006'
    };

    const response = await recovery.resetRecoveryOwner(newRecoveryOwner, r, s, v, txOptions);
    assert.isTrue(response, 'resetRecoveryOwner should return true');
    Spy.assert(rawTx, 1, [[newRecoveryOwner, r, s, v]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = 's';
    const txOptions = undefined;

    await AssertAsync.reject(
      recovery.resetRecoveryOwner(newRecoveryOwner, r, s, v, txOptions),
      'Invalid transaction options: undefined.'
    );
  });

  it('should throw an error when account address is undefined', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = 's';
    const txOptions = {};
    await AssertAsync.reject(
      recovery.resetRecoveryOwner(newRecoveryOwner, r, s, v, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`
    );
  });

  it('should throw an error when account address is invalid', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = 's';
    const txOptions = {
      from: '0x123'
    };
    await AssertAsync.reject(
      recovery.resetRecoveryOwner(newRecoveryOwner, r, s, v, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`
    );
  });
});
