'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');
const Utils = require('../../../utils/Utils');

describe('GnosisSafe.execTransaction()', () => {
  let gnosisSafe;

  beforeEach(() => {
    const web3 = new Web3();
    const gnosisAddress = '0x0000000000000000000000000000000000000002';
    gnosisSafe = new GnosisSafe(web3, gnosisAddress);
  });

  it('should construct with correct parameters', async () => {
    const to = '0x0000000000000000000000000000000000000003';
    const value = null;
    const data = null;
    const operation = 0;
    const safeTxGas = 0;
    const dataGas = 0;
    const gasPrice = 0;
    const gasToken = '0x0000000000000000000000000000000000000004';
    const refundReceiver = '0x0000000000000000000000000000000000000005';
    const signatures =
      '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c176084bee7d55432ecc6cc04736556c17a21f5a4c0df07024af91c749c630b31561c';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000006'
    };

    const mockRawTx = 'mockRawTx';
    const execTransactionRawTx = sinon.replace(gnosisSafe, 'execTransactionRawTx', sinon.fake.resolves(mockRawTx));
    const spySendTransaction = sinon.replace(Utils, 'sendTransaction', sinon.fake.resolves(true));
    const response = await gnosisSafe.execTransaction(
      to,
      value,
      data,
      operation,
      safeTxGas,
      dataGas,
      gasPrice,
      gasToken,
      refundReceiver,
      signatures,
      txOptions
    );

    assert.isTrue(response, 'execTransaction should return true');
    Spy.assert(execTransactionRawTx, 1, [
      [to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, signatures]
    ]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when txOptions is undefined', async () => {
    const to = undefined;
    const value = null;
    const data = null;
    const operation = 0;
    const safeTxGas = 0;
    const dataGas = 0;
    const gasPrice = 0;
    const gasToken = '0x0000000000000000000000000000000000000004';
    const refundReceiver = '0x0000000000000000000000000000000000000005';
    const signatures =
      '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c176084bee7d55432ecc6cc04736556c17a21f5a4c0df07024af91c749c630b31561c';
    await AssertAsync.reject(
      gnosisSafe.execTransaction(
        to,
        value,
        data,
        operation,
        safeTxGas,
        dataGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signatures
      ),
      `Invalid transaction options.`
    );
  });

  it('should throw an error when txOptions.from is undefined', async () => {
    const to = undefined;
    const value = null;
    const data = null;
    const operation = 0;
    const safeTxGas = 0;
    const dataGas = 0;
    const gasPrice = 0;
    const gasToken = '0x0000000000000000000000000000000000000004';
    const refundReceiver = '0x0000000000000000000000000000000000000005';
    const signatures =
      '0xdfc2f04f19e6d253cd3980e663f57600f33fc1a16697f5e9703e8dc23d2d1c176084bee7d55432ecc6cc04736556c17a21f5a4c0df07024af91c749c630b31561c';
    await AssertAsync.reject(
      gnosisSafe.execTransaction(
        to,
        value,
        data,
        operation,
        safeTxGas,
        dataGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signatures,
        {}
      ),
      `Invalid from address: undefined.`
    );
  });
});
