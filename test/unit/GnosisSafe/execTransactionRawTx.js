'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const AssertAsync = require('../../../utils/AssertAsync');
const GnosisSafe = require('../../../lib/ContractInteract/GnosisSafe');

describe('GnosisSafe.execTransactionRawTx()', () => {
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

    const mockExecTransaction = 'mockExecTransaction';
    const execTransactionSpy = sinon.replace(
      gnosisSafe.contract.methods,
      'execTransaction',
      sinon.fake.resolves(mockExecTransaction)
    );
    const response = await gnosisSafe.execTransactionRawTx(
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
    );

    assert.strictEqual(response, mockExecTransaction);
    Spy.assert(execTransactionSpy, 1, [
      [to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, signatures]
    ]);
  });

  it('should throw an error when to address is undefined', async () => {
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
      gnosisSafe.execTransactionRawTx(
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
      `Mandatory Parameter 'to' is missing or invalid: undefined.`
    );
  });
});
