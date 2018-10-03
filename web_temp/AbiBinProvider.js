'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const AbiBinProvider = function(abiFolderPath, binFolderPath) {
  const oThis = this;
  oThis.abiFolderPath = abiFolderPath || oThis.abiFolderPath;
  oThis.binFolderPath = binFolderPath || oThis.binFolderPath;
};

AbiBinProvider.prototype = {
  constructor: AbiBinProvider,
  custom: null,
  abiFolderPath: '../contracts/abi/',
  binFolderPath: '../contracts/bin/',
  addABI: function(contractName, abiFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    let abi;
    if (typeof abiFileContent === 'string') {
      //Parse it.
      abi = JSON.parse(abiFileContent);
    } else if (typeof abiFileContent === 'object') {
      abi = abiFileContent;
    } else {
      let err = new Error('Abi should be either JSON String or an object');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.abi) {
      let err = new Error(`Abi for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.abi = abi;
  },

  addBIN: function(contractName, binFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    if (typeof binFileContent !== 'string') {
      //Parse it.
      let err = new Error('Bin should be a string');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.bin) {
      let err = new Error(`Bin for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.bin = binFileContent;
  },

  getABI: function(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].abi) {
      return oThis.custom[contractName].abi;
    }

    //__NOT_FOR_WEB__BEGIN__
    let abiFileContent = oThis._read(oThis.abiFolderPath + contractName + '.abi');
    let abi = JSON.parse(abiFileContent);
    return abi;
    //__NOT_FOR_WEB__END__
  },

  getBIN: function(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].bin) {
      return oThis.custom[contractName].bin;
    }

    //__NOT_FOR_WEB__BEGIN__
    let binCode = oThis._read(oThis.binFolderPath + contractName + '.bin');
    return binCode;
    //__NOT_FOR_WEB__END__
  },

  _read: function(filePath) {
    //__NOT_FOR_WEB__BEGIN__
    filePath = path.join(__dirname, '/' + filePath);
    return fs.readFileSync(filePath, 'utf8');
    //__NOT_FOR_WEB__END__
  }
};

module.exports = AbiBinProvider;

AbiBinProvider.prototype.addABI('MockToken', [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'TOKEN_NAME',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_from', type: 'address' }, { name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'transferFrom',
    outputs: [{ name: 'success', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'TOKEN_SYMBOL',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'TOKEN_DECIMALS',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'DECIMALSFACTOR',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'TOKENS_MAX',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'remove',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_proposedOwner', type: 'address' }],
    name: 'initiateOwnershipTransfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'proposedOwner',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'completeOwnershipTransfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  { inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: '_proposedOwner', type: 'address' }],
    name: 'OwnershipTransferInitiated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: '_newOwner', type: 'address' }],
    name: 'OwnershipTransferCompleted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_from', type: 'address' },
      { indexed: true, name: '_to', type: 'address' },
      { indexed: false, name: '_value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_owner', type: 'address' },
      { indexed: true, name: '_spender', type: 'address' },
      { indexed: false, name: '_value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  }
]);
AbiBinProvider.prototype.addABI('TokenHolder', [
  {
    constant: false,
    inputs: [
      { name: '_ephemeralKey', type: 'address' },
      { name: '_spendingLimit', type: 'uint256' },
      { name: '_expirationHeight', type: 'uint256' }
    ],
    name: 'authorizeSession',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'AUTHORIZE_SESSION_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_transactionID', type: 'uint256' }],
    name: 'isTransactionConfirmed',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_oldWallet', type: 'address' }, { name: '_newWallet', type: 'address' }],
    name: 'submitReplaceWallet',
    outputs: [{ name: 'transactionID_', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'REMOVE_WALLET_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_ephemeralKey', type: 'address' }],
    name: 'revokeSession',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_transactionID', type: 'uint256' }],
    name: 'revokeConfirmation',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'walletCount',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_ephemeralKey', type: 'address' },
      { name: '_spendingLimit', type: 'uint256' },
      { name: '_expirationHeight', type: 'uint256' }
    ],
    name: 'submitAuthorizeSession',
    outputs: [{ name: 'transactionID_', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_required', type: 'uint256' }],
    name: 'submitRequirementChange',
    outputs: [{ name: 'transactionID_', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'ephemeralKeys',
    outputs: [
      { name: 'spendingLimit', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expirationHeight', type: 'uint256' },
      { name: 'status', type: 'uint8' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }],
    name: 'confirmations',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_wallet', type: 'address' }],
    name: 'submitAddWallet',
    outputs: [{ name: 'transactionID_', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'EXECUTE_RULE_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_data', type: 'bytes' },
      { name: '_nonce', type: 'uint256' },
      { name: '_v', type: 'uint8' },
      { name: '_r', type: 'bytes32' },
      { name: '_s', type: 'bytes32' }
    ],
    name: 'executeRule',
    outputs: [{ name: 'executeStatus_', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }],
    name: 'wallets',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'CHANGE_REQUIREMENT_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_wallet', type: 'address' }],
    name: 'submitRemoveWallet',
    outputs: [{ name: 'transactionID_', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }],
    name: 'transactions',
    outputs: [
      { name: 'destination', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'executed', type: 'bool' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_wallet', type: 'address' }],
    name: 'removeWallet',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'transactionCount',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_required', type: 'uint256' }],
    name: 'changeRequirement',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_transactionID', type: 'uint256' }],
    name: 'confirmTransaction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'REPLACE_WALLET_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'isWallet',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'brandedToken',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'required',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_oldWallet', type: 'address' }, { name: '_newWallet', type: 'address' }],
    name: 'replaceWallet',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_transactionID', type: 'uint256' }],
    name: 'executeTransaction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_wallet', type: 'address' }],
    name: 'addWallet',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'ADD_WALLET_CALLPREFIX',
    outputs: [{ name: '', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_brandedToken', type: 'address' },
      { name: '_tokenRules', type: 'address' },
      { name: '_required', type: 'uint256' },
      { name: '_wallets', type: 'address[]' }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionId', type: 'uint256' },
      { indexed: false, name: '_ephemeralKey', type: 'address' },
      { indexed: false, name: '_spendingLimit', type: 'uint256' },
      { indexed: false, name: '_expirationHeight', type: 'uint256' }
    ],
    name: 'SessionAuthorizationSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_ephemeralKey', type: 'address' }
    ],
    name: 'SessionRevocationSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: '_messageHash', type: 'bytes32' },
      { indexed: false, name: '_nonce', type: 'uint256' },
      { indexed: false, name: '_status', type: 'bool' }
    ],
    name: 'RuleExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_wallet', type: 'address' }
    ],
    name: 'WalletAdditionSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_wallet', type: 'address' }
    ],
    name: 'WalletRemovalSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_required', type: 'uint256' }
    ],
    name: 'RequirementChangeSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_oldWallet', type: 'address' },
      { indexed: false, name: '_newWallet', type: 'address' }
    ],
    name: 'WalletReplacementSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_wallet', type: 'address' }
    ],
    name: 'TransactionConfirmed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_transactionID', type: 'uint256' },
      { indexed: false, name: '_wallet', type: 'address' }
    ],
    name: 'TransactionConfirmationRevoked',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: '_transactionID', type: 'uint256' }],
    name: 'TransactionExecutionSucceeded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: '_transactionID', type: 'uint256' }],
    name: 'TransactionExecutionFailed',
    type: 'event'
  }
]);
AbiBinProvider.prototype.addABI('TokenRules', [
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }],
    name: 'rules',
    outputs: [
      { name: 'ruleName', type: 'string' },
      { name: 'ruleAddress', type: 'address' },
      { name: 'ruleAbi', type: 'string' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'disallowTransfers',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'allowTransfers',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'rulesByNameHash',
    outputs: [{ name: 'index', type: 'uint256' }, { name: 'exists', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'organization',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_ruleName', type: 'string' },
      { name: '_ruleAddress', type: 'address' },
      { name: '_ruleAbi', type: 'string' }
    ],
    name: 'registerRule',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_globalConstraintAddress', type: 'address' }],
    name: 'removeGlobalConstraint',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: '_globalConstraintAddress', type: 'address' }],
    name: 'addGlobalConstraint',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }],
    name: 'globalConstraints',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'allowedTransfers',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_transfersTo', type: 'address[]' },
      { name: '_transfersAmount', type: 'uint256[]' }
    ],
    name: 'checkGlobalConstraints',
    outputs: [{ name: '_passed', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_transfersTo', type: 'address[]' },
      { name: '_transfersAmount', type: 'uint256[]' }
    ],
    name: 'executeTransfers',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'globalConstraintCount',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'rulesByAddress',
    outputs: [{ name: 'index', type: 'uint256' }, { name: 'exists', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_organization', type: 'address' }, { name: '_token', type: 'address' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: '_ruleName', type: 'string' },
      { indexed: false, name: '_ruleAddress', type: 'address' }
    ],
    name: 'RuleRegistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: '_globalConstraintAddress', type: 'address' }],
    name: 'GlobalConstraintAdded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: '_globalConstraintAddress', type: 'address' }],
    name: 'GlobalConstraintRemoved',
    type: 'event'
  }
]);
AbiBinProvider.prototype.addABI('TransferRule', [
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_tokenRules', type: 'address' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  }
]);
AbiBinProvider.prototype.addBIN(
  'MockToken',
  '608060405234801561001057600080fd5b5060008054600160a060020a031916331790556040805180820190915260048082527f4d4f434b00000000000000000000000000000000000000000000000000000000602090920191825261006791600391610128565b5060408051808201909152600a8082527f4d6f636b20546f6b656e0000000000000000000000000000000000000000000060209092019182526100ac91600291610128565b506004805460ff191660121790556b0295be96e640669720000000600581905560008054600160a060020a0390811682526006602090815260408084208590558354815195865290519216937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a36101c3565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061016957805160ff1916838001178555610196565b82800160010185558215610196579182015b8281111561019657825182559160200191906001019061017b565b506101a29291506101a6565b5090565b6101c091905b808211156101a257600081556001016101ac565b90565b610951806101d26000396000f3006080604052600436106101065763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166306fdde03811461010b578063095ea7b31461019557806318160ddd146101cd57806318821400146101f457806323b872dd146102095780632a90531814610233578063313ce567146102485780635b7f415c1461027357806370a08231146102885780638bc04eb7146102a95780638da5cb5b146102be57806395d89b41146102ef578063a67e91a814610304578063a7f4377914610319578063a9059cbb14610330578063c0b6f56114610354578063d153b60c14610375578063dd62ed3e1461038a578063e71a7811146103b1575b600080fd5b34801561011757600080fd5b506101206103c6565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561015a578181015183820152602001610142565b50505050905090810190601f1680156101875780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b3480156101a157600080fd5b506101b9600160a060020a0360043516602435610459565b604080519115158252519081900360200190f35b3480156101d957600080fd5b506101e26104bf565b60408051918252519081900360200190f35b34801561020057600080fd5b506101206104c5565b34801561021557600080fd5b506101b9600160a060020a03600435811690602435166044356104fc565b34801561023f57600080fd5b50610120610607565b34801561025457600080fd5b5061025d61063e565b6040805160ff9092168252519081900360200190f35b34801561027f57600080fd5b5061025d610647565b34801561029457600080fd5b506101e2600160a060020a036004351661064c565b3480156102b557600080fd5b506101e2610667565b3480156102ca57600080fd5b506102d3610673565b60408051600160a060020a039092168252519081900360200190f35b3480156102fb57600080fd5b50610120610682565b34801561031057600080fd5b506101e26106e3565b34801561032557600080fd5b5061032e6106f3565b005b34801561033c57600080fd5b506101b9600160a060020a036004351660243561070a565b34801561036057600080fd5b506101b9600160a060020a03600435166107ba565b34801561038157600080fd5b506102d361082c565b34801561039657600080fd5b506101e2600160a060020a036004358116906024351661083b565b3480156103bd57600080fd5b506101b9610866565b60028054604080516020601f600019610100600187161502019094168590049384018190048102820181019092528281526060939092909183018282801561044f5780601f106104245761010080835404028352916020019161044f565b820191906000526020600020905b81548152906001019060200180831161043257829003601f168201915b5050505050905090565b336000818152600760209081526040808320600160a060020a038716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a350600192915050565b60055490565b60408051808201909152600a81527f4d6f636b20546f6b656e00000000000000000000000000000000000000000000602082015281565b600160a060020a038316600090815260066020526040812054610525908363ffffffff6108e916565b600160a060020a0385166000908152600660209081526040808320939093556007815282822033835290522054610562908363ffffffff6108e916565b600160a060020a0380861660009081526007602090815260408083203384528252808320949094559186168152600690915220546105a6908363ffffffff6108fb16565b600160a060020a0380851660008181526006602090815260409182902094909455805186815290519193928816927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35060019392505050565b60408051808201909152600481527f4d4f434b00000000000000000000000000000000000000000000000000000000602082015281565b60045460ff1690565b601281565b600160a060020a031660009081526006602052604090205490565b670de0b6b3a764000081565b600054600160a060020a031681565b60038054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561044f5780601f106104245761010080835404028352916020019161044f565b6b0295be96e64066972000000081565b6106fc33610911565b151561070757600080fd5b33ff5b3360009081526006602052604081205461072a908363ffffffff6108e916565b3360009081526006602052604080822092909255600160a060020a0385168152205461075c908363ffffffff6108fb16565b600160a060020a0384166000818152600660209081526040918290209390935580518581529051919233927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a350600192915050565b60006107c533610911565b15156107d057600080fd5b6001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0384169081179091556040517f20f5afdf40bf7b43c89031a5d4369a30b159e512d164aa46124bcb706b4a1caf90600090a2506001919050565b600154600160a060020a031681565b600160a060020a03918216600090815260076020908152604080832093909416825291909152205490565b600154600090600160a060020a0316331461088057600080fd5b6001805460008054600160a060020a0380841673ffffffffffffffffffffffffffffffffffffffff19928316178084559190931690935560405192909116917f624adc4c72536289dd9d5439ccdeccd8923cb9af95fb626b21935447c77b84079190a250600190565b6000828211156108f557fe5b50900390565b60008282018381101561090a57fe5b9392505050565b600054600160a060020a03908116911614905600a165627a7a72305820e6c5c8e24d6caf24965cabc5ffdf39ce3ce09677dbcd6990f9c91e8053ea7f7b0029'
);
AbiBinProvider.prototype.addBIN(
  'TokenHolder',
  '60806040523480156200001157600080fd5b50604051620035243803806200352483398101604090815281516020830151918301516060840151909301805191939181908390600090828181118015906200005957508015155b80156200006557508115155b1515620000f957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602360248201527f526571756972656d656e742076616c6964697479206e6f742066756c66696c6c60448201527f65642e0000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600092505b8451831015620002945784516000908690859081106200011a57fe5b60209081029091010151600160a060020a031614156200019b57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601460248201527f57616c6c6574206164647265737320697320302e000000000000000000000000604482015290519081900360640190fd5b600160008685815181101515620001ae57fe5b6020908102909101810151600160a060020a031682528101919091526040016000205460ff16156200024157604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4475706c69636174652077616c6c657420616464726573732e00000000000000604482015290519081900360640190fd5b600180600087868151811015156200025557fe5b602090810291909101810151600160a060020a03168252810191909152604001600020805460ff191691151591909117905560019290920191620000fe565b8451620002a990600290602088019062000423565b5050506000919091555050600160a060020a03841615156200035157604080517f08c379a0000000000000000000000000000000000000000000000000000000008152602060048201526024808201527f4272616e64656420746f6b656e20636f6e74726163742061646472657373206960448201527f7320302e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600160a060020a0383161515620003ef57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602160248201527f546f6b656e52756c657320636f6e74726163742061646472657373206973203060448201527f2e00000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b505060068054600160a060020a03938416600160a060020a03199182161790915560088054929093169116179055620004b7565b8280548282559060005260206000209081019282156200047b579160200282015b828111156200047b5782518254600160a060020a031916600160a060020a0390911617825560209092019160019091019062000444565b50620004899291506200048d565b5090565b620004b491905b8082111562000489578054600160a060020a031916815560010162000494565b90565b61305d80620004c76000396000f30060806040526004361061018a5763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663028c979d811461018f57806309d43931146101b85780630b1cd2c0146101ea5780630cdac846146102165780631988f9cc1461024f5780631fa5d6a41461026457806320ea8d861461028557806329b57c691461029d5780632d0b691f146102b25780632eb79f60146102d95780632f938e64146102f15780633411c81c1461034b57806336dae4261461036f57806351491e0c1461039057806359793b00146103a55780637ad71f72146104205780637d90cc511461045457806387fe2feb146104695780639ace38c21461048a578063a75fe8e114610534578063b77bf60014610555578063ba51a6df1461056a578063c01a8c8414610582578063c763a4ba1461059a578063ce5570ec146105af578063d348050c146105d0578063dc8452cd146105e5578063e50b2bc2146105fa578063ee22610b14610621578063efeb5f1f14610639578063f00735301461065a575b600080fd5b34801561019b57600080fd5b506101b6600160a060020a036004351660243560443561066f565b005b3480156101c457600080fd5b506101cd6107eb565b60408051600160e060020a03199092168252519081900360200190f35b3480156101f657600080fd5b50610202600435610846565b604080519115158252519081900360200190f35b34801561022257600080fd5b5061023d600160a060020a0360043581169060243516610973565b60408051918252519081900360200190f35b34801561025b57600080fd5b506101cd610bc4565b34801561027057600080fd5b506101b6600160a060020a0360043516610bf9565b34801561029157600080fd5b506101b6600435610d5f565b3480156102a957600080fd5b5061023d610f8f565b3480156102be57600080fd5b5061023d600160a060020a0360043516602435604435610f96565b3480156102e557600080fd5b5061023d600435611268565b3480156102fd57600080fd5b50610312600160a060020a03600435166113f1565b6040518085815260200184815260200183815260200182600281111561033457fe5b60ff16815260200194505050505060405180910390f35b34801561035757600080fd5b50610202600435600160a060020a036024351661141b565b34801561037b57600080fd5b5061023d600160a060020a036004351661143b565b34801561039c57600080fd5b506101cd61169d565b3480156103b157600080fd5b5060408051602060046024803582810135601f8101859004850286018501909652858552610202958335600160a060020a03169536956044949193909101919081908401838280828437509497505084359550505050602082013560ff169160408101359150606001356116f8565b34801561042c57600080fd5b50610438600435611a77565b60408051600160a060020a039092168252519081900360200190f35b34801561046057600080fd5b506101cd611a9f565b34801561047557600080fd5b5061023d600160a060020a0360043516611ad4565b34801561049657600080fd5b506104a2600435611ce1565b60408051600160a060020a038516815282151591810191909152606060208083018281528551928401929092528451608084019186019080838360005b838110156104f75781810151838201526020016104df565b50505050905090810190601f1680156105245780820380516001836020036101000a031916815260200191505b5094505050505060405180910390f35b34801561054057600080fd5b506101b6600160a060020a0360043516611d9e565b34801561056157600080fd5b5061023d611f6c565b34801561057657600080fd5b506101b6600435611f72565b34801561058e57600080fd5b506101b660043561203c565b3480156105a657600080fd5b506101cd61220a565b3480156105bb57600080fd5b50610202600160a060020a036004351661223f565b3480156105dc57600080fd5b50610438612254565b3480156105f157600080fd5b5061023d612263565b34801561060657600080fd5b506101b6600160a060020a0360043581169060243516612269565b34801561062d57600080fd5b506101b66004356124a0565b34801561064557600080fd5b506101b6600160a060020a03600435166127ab565b34801561066657600080fd5b506101cd6129a6565b60003330146106c3576040805160e560020a62461bcd0281526020600482015260216024820152600080516020612fd2833981519152604482015260f960020a601702606482015290519081900360840190fd5b83600160a060020a0381161515610724576040805160e560020a62461bcd02815260206004820152601460248201527f4b65792061646472657373206973206e756c6c2e000000000000000000000000604482015290519081900360640190fd5b600160a060020a038516600090815260076020526040812060030154869160ff9091169081600281111561075457fe5b146107a9576040805160e560020a62461bcd02815260206004820152601660248201527f4b6579206973206e6f7420617574686f72697a65642e00000000000000000000604482015290519081900360640190fd5b50505050600160a060020a039290921660009081526007602052604081209182556002820192909255600180820192909255600301805460ff19169091179055565b604080517f617574686f72697a6553657373696f6e28616464726573732c75696e7432353681527f2c75696e743235362900000000000000000000000000000000000000000000006020820152905190819003602901902081565b600080600083600460008281526020019081526020016000206001018054600181600116156101000203166002900490506000141515156108bf576040805160e560020a62461bcd02815260206004820152601b6024820152600080516020612f52833981519152604482015290519081900360640190fd5b60008581526004602052604090206002015460ff16156108e2576001935061096b565b60009250600091505b600254821015610966576000858152600360205260408120600280549192918590811061091457fe5b6000918252602080832090910154600160a060020a0316835282019290925260400190205460ff1615610948576001830192505b60005483141561095b576001935061096b565b6001909101906108eb565b600093505b505050919050565b3360009081526001602052604081205460ff1615156109ca576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b600160a060020a038316600090815260016020526040902054839060ff161515610a2c576040805160e560020a62461bcd0281526020600482015260166024820152600080516020612f92833981519152604482015290519081900360640190fd5b82600160a060020a0381161515610a7b576040805160e560020a62461bcd0281526020600482015260176024820152600080516020612ff2833981519152604482015290519081900360640190fd5b600160a060020a038416600090815260016020526040902054849060ff1615610adc576040805160e560020a62461bcd02815260206004820152600e6024820152600080516020612fb2833981519152604482015290519081900360640190fd5b604080517f7265706c61636557616c6c657428616464726573732c616464726573732900008152815190819003601e018120600160a060020a03808a1660248401528816604480840191909152835180840390910181526064909201909252602081018051600160e060020a0316600160e060020a031990931692909217909152610b689030906129db565b60408051600160a060020a03808a16825288166020820152815192965086927f385ef46d7ab7d0d8628198545974c898282544fef2e9e6c6d18087148b95cb5f929181900390910190a2610bbb8461203c565b50505092915050565b604080517f72656d6f766557616c6c657428616464726573732900000000000000000000008152905190819003601501902081565b3360009081526001602052604090205460ff161515610c50576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b80600160a060020a0381161515610cb1576040805160e560020a62461bcd02815260206004820152601460248201527f4b65792061646472657373206973206e756c6c2e000000000000000000000000604482015290519081900360640190fd5b600160a060020a038216600090815260076020526040902060030154829060ff166001816002811115610ce057fe5b14610d35576040805160e560020a62461bcd02815260206004820152601660248201527f4b6579206973206e6f7420617574686f72697a65642e00000000000000000000604482015290519081900360640190fd5b505050600160a060020a03166000908152600760205260409020600301805460ff19166002179055565b3360009081526001602052604090205460ff161515610db6576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b8060046000828152602001908152602001600020600101805460018160011615610100020316600290049050600014151515610e2a576040805160e560020a62461bcd02815260206004820152601b6024820152600080516020612f52833981519152604482015290519081900360640190fd5b60008281526003602090815260408083203380855292529091205483919060ff161515610ec7576040805160e560020a62461bcd02815260206004820152602b60248201527f5472616e73616374696f6e206973206e6f7420636f6e6669726d65642062792060448201527f7468652077616c6c65742e000000000000000000000000000000000000000000606482015290519081900360840190fd5b600084815260046020526040902060020154849060ff1615610f33576040805160e560020a62461bcd02815260206004820152601860248201527f5472616e73616374696f6e2069732065786563757465642e0000000000000000604482015290519081900360640190fd5b60008581526003602090815260408083203380855290835292819020805460ff1916905580519283525187927fc604bfed3acf21d53a27ee0735b712b9d3e6691f4df5888f91a0bb5f128f5d1392908290030190a25050505050565b6002545b90565b3360009081526001602052604081205460ff161515610fed576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b83600160a060020a038116151561104e576040805160e560020a62461bcd02815260206004820152601460248201527f4b65792061646472657373206973206e756c6c2e000000000000000000000000604482015290519081900360640190fd5b600160a060020a038516600090815260076020526040812060030154869160ff9091169081600281111561107e57fe5b146110d3576040805160e560020a62461bcd02815260206004820152601660248201527f4b6579206973206e6f7420617574686f72697a65642e00000000000000000000604482015290519081900360640190fd5b438511611150576040805160e560020a62461bcd02815260206004820152603560248201527f45787069726174696f6e20686569676874206973206c746520746f207468652060448201527f63757272656e7420626c6f636b206865696768742e0000000000000000000000606482015290519081900360840190fd5b604080517f617574686f72697a6553657373696f6e28616464726573732c75696e7432353681527f2c75696e743235362900000000000000000000000000000000000000000000006020808301919091528251918290036029018220600160a060020a038b166024840152604483018a905260648084018a905284518085039091018152608490930190935281018051600160e060020a0316600160e060020a0319909316929092179091526112079030906129db565b60408051600160a060020a038a16815260208101899052808201889052905191955085917f6619ec03c5dd2519d2107a7829f566e12d2fa61f97b804420b93c4d1b721fd1b9181900360600190a261125e8461203c565b5050509392505050565b3360009081526001602052604081205460ff1615156112bf576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b600254828181118015906112d257508015155b80156112dd57508115155b1515611330576040805160e560020a62461bcd0281526020600482015260236024820152600080516020613012833981519152604482015260e960020a6232b21702606482015290519081900360840190fd5b604080517f6368616e6765526571756972656d656e742875696e74323536290000000000008152815190819003601a0181206024808301889052835180840390910181526044909201909252602081018051600160e060020a0316600160e060020a0319909316929092179091526113a99030906129db565b60408051868152905191945084917f762499bdaf3774f418baf7d6c8030e584abb195e0aa8c90b122e7951500b06699181900360200190a26113ea8361203c565b5050919050565b60076020526000908152604090208054600182015460028301546003909301549192909160ff1684565b600360209081526000928352604080842090915290825290205460ff1681565b3360009081526001602052604081205460ff161515611492576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b81600160a060020a03811615156114e1576040805160e560020a62461bcd0281526020600482015260176024820152600080516020612ff2833981519152604482015290519081900360640190fd5b600160a060020a038316600090815260016020526040902054839060ff1615611542576040805160e560020a62461bcd02815260206004820152600e6024820152600080516020612fb2833981519152604482015290519081900360640190fd5b60025461155690600163ffffffff612b3916565b60005481811115801561156857508015155b801561157357508115155b15156115c6576040805160e560020a62461bcd0281526020600482015260236024820152600080516020613012833981519152604482015260e960020a6232b21702606482015290519081900360840190fd5b604080517f61646457616c6c6574286164647265737329000000000000000000000000000081528151908190036012018120600160a060020a038916602480840191909152835180840390910181526044909201909252602081018051600160e060020a0316600160e060020a03199093169290921790915261164a9030906129db565b60408051600160a060020a0389168152905191965086917f39c5400ee7e5a4b5250fc9b0ee573eec66cb9ab74b4878cf0493089511414b179181900360200190a26116948561203c565b50505050919050565b604080517f6578656375746552756c6528616464726573732c62797465732c75696e74323581527f362c75696e74382c627974657333322c627974657333322900000000000000006020820152905190819003603801902081565b604080517f6578656375746552756c6528616464726573732c62797465732c75696e74323581527f362c75696e74382c627974657333322c6279746573333229000000000000000060208201529051908190036038019020600090819081908190611768908b8b8b8b8b8b612b4f565b600160a060020a0380821660009081526007602052604080822060085482517f2185810b000000000000000000000000000000000000000000000000000000008152925196995094975095509290911692632185810b92600480820193929182900301818387803b1580156117dc57600080fd5b505af11580156117f0573d6000803e3d6000fd5b50506006546008548454604080517f095ea7b3000000000000000000000000000000000000000000000000000000008152600160a060020a03938416600482015260248101929092525191909216935063095ea7b3925060448083019260209291908290030181600087803b15801561186857600080fd5b505af115801561187c573d6000803e3d6000fd5b505050506040513d602081101561189257600080fd5b50506040518951600160a060020a038c16918b918190602084019080838360005b838110156118cb5781810151838201526020016118b3565b50505050905090810190601f1680156118f85780820380516001836020036101000a031916815260200191505b509150506000604051808303816000865af1600654600854604080517f095ea7b3000000000000000000000000000000000000000000000000000000008152600160a060020a0392831660048201526000602482018190529151949a5091909216945063095ea7b39350604480820193602093909283900390910190829087803b15801561198557600080fd5b505af1158015611999573d6000803e3d6000fd5b505050506040513d60208110156119af57600080fd5b5050600854604080517f212c81570000000000000000000000000000000000000000000000000000000081529051600160a060020a039092169163212c81579160048082019260009290919082900301818387803b158015611a1057600080fd5b505af1158015611a24573d6000803e3d6000fd5b505060408051868152602081018c90528715158183015290517fcf5db588cf58b4468ef33b556ac71c35eeb1d5f2468cdadfa857122679f1ca6e9350908190036060019150a15050509695505050505050565b6002805482908110611a8557fe5b600091825260209091200154600160a060020a0316905081565b604080517f6368616e6765526571756972656d656e742875696e74323536290000000000008152905190819003601a01902081565b3360009081526001602052604081205460ff161515611b2b576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b600160a060020a038216600090815260016020526040902054829060ff161515611b8d576040805160e560020a62461bcd0281526020600482015260166024820152600080516020612f92833981519152604482015290519081900360640190fd5b600254600110611c0d576040805160e560020a62461bcd02815260206004820152602c60248201527f4c6173742077616c6c65742063616e6e6f74206265207375626d69747465642060448201527f666f722072656d6f76616c2e0000000000000000000000000000000000000000606482015290519081900360840190fd5b604080517f72656d6f766557616c6c6574286164647265737329000000000000000000000081528151908190036015018120600160a060020a038616602480840191909152835180840390910181526044909201909252602081018051600160e060020a0316600160e060020a031990931692909217909152611c919030906129db565b60408051600160a060020a0386168152905191935083917f4b516a5cb9faadf0d22d8b829b7e7d06cb38f45c53d9e379403f6a43a79044339181900360200190a2611cdb8261203c565b50919050565b6004602090815260009182526040918290208054600180830180548651600261010094831615949094026000190190911692909204601f8101869004860283018601909652858252600160a060020a03909216949293909290830182828015611d8b5780601f10611d6057610100808354040283529160200191611d8b565b820191906000526020600020905b815481529060010190602001808311611d6e57829003601f168201915b5050506002909301549192505060ff1683565b6000333014611df2576040805160e560020a62461bcd0281526020600482015260216024820152600080516020612fd2833981519152604482015260f960020a601702606482015290519081900360840190fd5b600160a060020a038216600090815260016020526040902054829060ff161515611e54576040805160e560020a62461bcd0281526020600482015260166024820152600080516020612f92833981519152604482015290519081900360640190fd5b600160a060020a0383166000908152600160205260408120805460ff1916905591505b60025460001901821015611f2f5782600160a060020a0316600283815481101515611e9e57fe5b600091825260209091200154600160a060020a03161415611f2457600280546000198101908110611ecb57fe5b60009182526020909120015460028054600160a060020a039092169184908110611ef157fe5b9060005260206000200160006101000a815481600160a060020a030219169083600160a060020a03160217905550611f2f565b600190910190611e77565b600254611f4390600163ffffffff612d6716565b611f4e600282612e95565b506002546000541115611f6757600254611f6790611f72565b505050565b60055481565b333014611fc4576040805160e560020a62461bcd0281526020600482015260216024820152600080516020612fd2833981519152604482015260f960020a601702606482015290519081900360840190fd5b60025481818111801590611fd757508015155b8015611fe257508115155b1515612035576040805160e560020a62461bcd0281526020600482015260236024820152600080516020613012833981519152604482015260e960020a6232b21702606482015290519081900360840190fd5b5050600055565b3360009081526001602052604090205460ff161515612093576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b8060046000828152602001908152602001600020600101805460018160011615610100020316600290049050600014151515612107576040805160e560020a62461bcd02815260206004820152601b6024820152600080516020612f52833981519152604482015290519081900360640190fd5b60008281526003602090815260408083203380855292529091205483919060ff16156121a3576040805160e560020a62461bcd02815260206004820152602760248201527f5472616e73616374696f6e20697320636f6e6669726d6564206279207468652060448201527f77616c6c65742e00000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60008481526003602090815260408083203380855290835292819020805460ff1916600117905580519283525186927f15c2f311c9e0f53b50388279894aeff029a3457884a6601e924fca879e12adcc92908290030190a2612204846124a0565b50505050565b604080517f7265706c61636557616c6c657428616464726573732c616464726573732900008152905190819003601e01902081565b60016020526000908152604090205460ff1681565b600654600160a060020a031681565b60005481565b60003330146122bd576040805160e560020a62461bcd0281526020600482015260216024820152600080516020612fd2833981519152604482015260f960020a601702606482015290519081900360840190fd5b600160a060020a038316600090815260016020526040902054839060ff16151561231f576040805160e560020a62461bcd0281526020600482015260166024820152600080516020612f92833981519152604482015290519081900360640190fd5b82600160a060020a038116151561236e576040805160e560020a62461bcd0281526020600482015260176024820152600080516020612ff2833981519152604482015290519081900360640190fd5b600160a060020a038416600090815260016020526040902054849060ff16156123cf576040805160e560020a62461bcd02815260206004820152600e6024820152600080516020612fb2833981519152604482015290519081900360640190fd5b600093505b6002548410156124605785600160a060020a03166002858154811015156123f757fe5b600091825260209091200154600160a060020a03161415612455578460028581548110151561242257fe5b9060005260206000200160006101000a815481600160a060020a030219169083600160a060020a03160217905550612460565b6001909301926123d4565b505050600160a060020a039283166000908152600160208190526040808320805460ff199081169091559490951682529390208054909216909217905550565b3360009081526001602052604081205460ff1615156124f7576040805160e560020a62461bcd02815260206004820152601f6024820152600080516020612f72833981519152604482015290519081900360640190fd5b816004600082815260200190815260200160002060010180546001816001161561010002031660029004905060001415151561256b576040805160e560020a62461bcd02815260206004820152601b6024820152600080516020612f52833981519152604482015290519081900360640190fd5b60008381526003602090815260408083203380855292529091205484919060ff161515612608576040805160e560020a62461bcd02815260206004820152602b60248201527f5472616e73616374696f6e206973206e6f7420636f6e6669726d65642062792060448201527f7468652077616c6c65742e000000000000000000000000000000000000000000606482015290519081900360840190fd5b600085815260046020526040902060020154859060ff1615612674576040805160e560020a62461bcd02815260206004820152601860248201527f5472616e73616374696f6e2069732065786563757465642e0000000000000000604482015290519081900360640190fd5b61267d86610846565b156127a357600086815260046020526040908190208054915160018083018054939950600160a060020a039094169392829184916002600019928216156101000292909201160480156127115780601f106126e657610100808354040283529160200191612711565b820191906000526020600020905b8154815290600101906020018083116126f457829003601f168201915b50509150506000604051808303816000865af19150501561276b5760028501805460ff1916600117905560405186907f82eadc3561110557a572bd74af5c06b37c7e9c14a8bf55a47abcaabd6b9d63df90600090a26127a3565b60028501805460ff1916905560405186907f2724cfb6dd99839f245928a05f4efb76270bb8ff17f88c75d139204bd91c83d090600090a25b505050505050565b3330146127fd576040805160e560020a62461bcd0281526020600482015260216024820152600080516020612fd2833981519152604482015260f960020a601702606482015290519081900360840190fd5b80600160a060020a038116151561284c576040805160e560020a62461bcd0281526020600482015260176024820152600080516020612ff2833981519152604482015290519081900360640190fd5b600160a060020a038216600090815260016020526040902054829060ff16156128ad576040805160e560020a62461bcd02815260206004820152600e6024820152600080516020612fb2833981519152604482015290519081900360640190fd5b6002546128c190600163ffffffff612b3916565b6000548181111580156128d357508015155b80156128de57508115155b1515612931576040805160e560020a62461bcd0281526020600482015260236024820152600080516020613012833981519152604482015260e960020a6232b21702606482015290519081900360840190fd5b50505050600160a060020a031660008181526001602081905260408220805460ff1916821790556002805491820181559091527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace01805473ffffffffffffffffffffffffffffffffffffffff19169091179055565b604080517f61646457616c6c657428616464726573732900000000000000000000000000008152905190819003601201902081565b6000600160a060020a0383161515612a3d576040805160e560020a62461bcd02815260206004820152601c60248201527f44657374696e6174696f6e2061646472657373206973206e756c6c2e00000000604482015290519081900360640190fd5b81511515612a95576040805160e560020a62461bcd02815260206004820152601960248201527f5061796c6f61642064617461206c656e67746820697320302e00000000000000604482015290519081900360640190fd5b5060055460408051606081018252600160a060020a0385811682526020808301868152600084860181905286815260048352949094208351815473ffffffffffffffffffffffffffffffffffffffff191693169290921782559251805192939192612b069260018501920190612eb9565b50604091909101516002909101805460ff1916911515919091179055600554612b30906001612b39565b60055592915050565b600082820183811015612b4857fe5b9392505050565b6000806000612bbc8a8a8a6040518082805190602001908083835b60208310612b895780518252601f199092019160209182019101612b6a565b6001836020036101000a03801982511681845116808217855250505050505090500191505060405180910390208a612d79565b604080516000808252602080830180855285905260ff8b1683850152606083018a905260808301899052925193965060019360a08084019493601f19830193908390039091019190865af1158015612c18573d6000803e3d6000fd5b505060408051601f190151600160a060020a0381166000908152600760205291909120909350915060019050600382015460ff166002811115612c5757fe5b148015612c675750438160020154115b1515612cbd576040805160e560020a62461bcd02815260206004820152601c60248201527f457068656d6572616c206b6579206973206e6f74206163746976652e00000000604482015290519081900360640190fd5b60018101548714612d3e576040805160e560020a62461bcd02815260206004820152602860248201527f4e6f6e6365206973206e6f7420657175616c20746f207468652063757272656e60448201527f74206e6f6e63652e000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600181810154612d539163ffffffff612b3916565b600190910155909890975095505050505050565b600082821115612d7357fe5b50900390565b604080517f19000000000000000000000000000000000000000000000000000000000000006020808301919091526000602183018190526c010000000000000000000000003081026022850152600160a060020a038816026036840152604a8301819052604b8301869052606b8301859052608b8301819052608c8301819052608d8301819052600160e060020a03198816608e8401526092830181905260938084018290528451808503909101815260b39093019384905282519093918291908401908083835b60208310612e605780518252601f199092019160209182019101612e41565b5181516020939093036101000a6000190180199091169216919091179052604051920182900390912098975050505050505050565b815481835581811115611f6757600083815260209020611f67918101908301612f37565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10612efa57805160ff1916838001178555612f27565b82800160010185558215612f27579182015b82811115612f27578251825591602001919060010190612f0c565b50612f33929150612f37565b5090565b610f9391905b80821115612f335760008155600101612f3d56005472616e73616374696f6e20646f6573206e6f742065786973742e00000000004f6e6c792077616c6c657420697320616c6c6f77656420746f2063616c6c2e0057616c6c657420646f6573206e6f742065786973742e0000000000000000000057616c6c6574206578697374732e0000000000000000000000000000000000004f6e6c79206d756c746973696720697320616c6c6f77656420746f2063616c6c57616c6c65742061646472657373206973206e756c6c2e000000000000000000526571756972656d656e742076616c6964697479206e6f742066756c66696c6ca165627a7a723058209a438b0118d1ba4db1d3661241717296386cb6e18b85f0220b09cc1b344d5f710029'
);
AbiBinProvider.prototype.addBIN(
  'TokenRules',
  '608060405234801561001057600080fd5b506040516040806117d3833981016040528051602090910151600160a060020a03821615156100a057604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f4f7267616e697a6174696f6e2061646472657373206973206e756c6c2e000000604482015290519081900360640190fd5b600160a060020a038116151561011757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f546f6b656e2061646472657373206973206e756c6c2e00000000000000000000604482015290519081900360640190fd5b60048054600160a060020a03938416600160a060020a03199182161790915560058054929093169116179055611681806101526000396000f3006080604052600436106100c15763ffffffff60e060020a60003504166304d6ded481146100c6578063212c8157146101d55780632185810b146101ec57806322f468ea1461020157806323bd4d7a146102325780633e290e5c14610263578063488b38141461029c5780635f30e581146102bd57806365ab1ae8146102de578063661309ac146102f657806369cc40031461032b578063a6a192da146103c7578063c3a90bf914610400578063d6a7d22614610427578063fc0c546a14610448575b600080fd5b3480156100d257600080fd5b506100de60043561045d565b604051808060200184600160a060020a0316600160a060020a0316815260200180602001838103835286818151815260200191508051906020019080838360005b8381101561013757818101518382015260200161011f565b50505050905090810190601f1680156101645780820380516001836020036101000a031916815260200191505b50838103825284518152845160209182019186019080838360005b8381101561019757818101518382015260200161017f565b50505050905090810190601f1680156101c45780820380516001836020036101000a031916815260200191505b509550505050505060405180910390f35b3480156101e157600080fd5b506101ea6105b2565b005b3480156101f857600080fd5b506101ea6105cb565b34801561020d57600080fd5b506102196004356105e7565b6040805192835290151560208301528051918290030190f35b34801561023e57600080fd5b50610247610603565b60408051600160a060020a039092168252519081900360200190f35b34801561026f57600080fd5b506101ea602460048035828101929082013591600160a060020a0382351691604435908101910135610612565b3480156102a857600080fd5b506101ea600160a060020a0360043516610b58565b3480156102c957600080fd5b506101ea600160a060020a0360043516610cdb565b3480156102ea57600080fd5b50610247600435610ee3565b34801561030257600080fd5b50610317600160a060020a0360043516610f0b565b604080519115158252519081900360200190f35b34801561033757600080fd5b50604080516020600460248035828101358481028087018601909752808652610317968435600160a060020a031696369660449591949091019291829185019084908082843750506040805187358901803560208181028481018201909552818452989b9a998901989297509082019550935083925085019084908082843750949750610f209650505050505050565b3480156103d357600080fd5b506101ea60048035600160a060020a03169060248035808201929081013591604435908101910135611088565b34801561040c57600080fd5b506104156113fd565b60408051918252519081900360200190f35b34801561043357600080fd5b50610219600160a060020a0360043516611404565b34801561045457600080fd5b50610247611420565b600080548290811061046b57fe5b60009182526020918290206003919091020180546040805160026001841615610100026000190190931692909204601f8101859004850283018501909152808252919350918391908301828280156105045780601f106104d957610100808354040283529160200191610504565b820191906000526020600020905b8154815290600101906020018083116104e757829003601f168201915b505050506001838101546002808601805460408051602061010097841615979097026000190190921693909304601f81018690048602820186019093528281529596600160a060020a039093169592945091928301828280156105a85780601f1061057d576101008083540402835291602001916105a8565b820191906000526020600020905b81548152906001019060200180831161058b57829003601f168201915b5050505050905083565b336000908152600660205260409020805460ff19169055565b336000908152600660205260409020805460ff19166001179055565b6002602052600090815260409020805460019091015460ff1682565b600454600160a060020a031681565b600061061c611567565b610624611586565b600454600160a060020a031633146106ac576040805160e560020a62461bcd02815260206004820152602560248201527f4f6e6c79206f7267616e697a6174696f6e20697320616c6c6f77656420746f2060448201527f63616c6c2e000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b861515610703576040805160e560020a62461bcd02815260206004820152601360248201527f52756c65206e616d6520697320656d7074792e00000000000000000000000000604482015290519081900360640190fd5b600160a060020a0386161515610763576040805160e560020a62461bcd02815260206004820152601560248201527f52756c652061646472657373206973206e756c6c2e0000000000000000000000604482015290519081900360640190fd5b8315156107ba576040805160e560020a62461bcd02815260206004820152601260248201527f52756c652041424920697320656d7074792e0000000000000000000000000000604482015290519081900360640190fd5b8787604051602001808383808284378201915050925050506040516020818303038152906040526040518082805190602001908083835b602083106108105780518252601f1990920191602091820191016107f1565b51815160209384036101000a6000190180199092169116179052604080519290940182900390912060008181526002909252929020600101549196505060ff161591506108cf9050576040805160e560020a62461bcd02815260206004820152602c60248201527f52756c6520776974682074686520737065636966696564206e616d6520616c7260448201527f65616479206578697374732e0000000000000000000000000000000000000000606482015290519081900360840190fd5b600160a060020a0386166000908152600160208190526040909120015460ff161561096a576040805160e560020a62461bcd02815260206004820152602f60248201527f52756c652077697468207468652073706563696669656420616464726573732060448201527f616c7265616479206578697374732e0000000000000000000000000000000000606482015290519081900360840190fd5b6040805160806020601f8b0181900402820181019092526060810189815290918291908b908b9081908501838280828437820191505050505050815260200187600160a060020a0316815260200186868080601f01602080910402602001604051908101604052809392919081815260200183838082843750505092909352505060408051808201825260008054825260016020808401828152600160a060020a038e168452828252858420855181558151908401805491151560ff199283161790558b85526002835295842085518155905190830180549115159190961617909455815490810180835591805285518051969850929650909487945060039091027f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5630192610a9d92849291019061159d565b5060208281015160018301805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0390921691909117905560408301518051610ae9926002850192019061159d565b505060408051600160a060020a038a1660208201528181529081018a90527f4d39292a7c76562755f38e419d757d846579699af484d88be86a1811dca7321592508a91508990899080606081018585808284376040519201829003965090945050505050a15050505050505050565b600454600090600160a060020a03163314610be3576040805160e560020a62461bcd02815260206004820152602560248201527f4f6e6c79206f7267616e697a6174696f6e20697320616c6c6f77656420746f2060448201527f63616c6c2e000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600160a060020a0382161515610c43576040805160e560020a62461bcd02815260206004820152601d60248201527f436f6e73747261696e7420746f2072656d766f65206973206e756c6c2e000000604482015290519081900360640190fd5b610c4c8261142f565b600354909150811415610cce576040805160e560020a62461bcd028152602060048201526024808201527f436f6e73747261696e7420746f2072656d6f766520646f6573206e6f7420657860448201527f6973742e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b610cd781611481565b5050565b600454600090600160a060020a03163314610d66576040805160e560020a62461bcd02815260206004820152602560248201527f4f6e6c79206f7267616e697a6174696f6e20697320616c6c6f77656420746f2060448201527f63616c6c2e000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600160a060020a0382161515610dc6576040805160e560020a62461bcd02815260206004820152601a60248201527f436f6e73747261696e7420746f20616464206973206e756c6c2e000000000000604482015290519081900360640190fd5b610dcf8261142f565b6003549091508114610e51576040805160e560020a62461bcd02815260206004820152602160248201527f436f6e73747261696e7420746f2061646420616c72656164792065786973747360448201527f2e00000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600380546001810182556000919091527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b018054600160a060020a03841673ffffffffffffffffffffffffffffffffffffffff19909116811790915560408051918252517f3fc8f7d9dd3ec32e95a79dede9e9ea171475382d20c24f7c6e6589c2d7416db29181900360200190a15050565b6003805482908110610ef157fe5b600091825260209091200154600160a060020a0316905081565b60066020526000908152604090205460ff1681565b600160005b60035481108015610f335750815b15611080576003805482908110610f4657fe5b9060005260206000200160009054906101000a9004600160a060020a0316600160a060020a03166360156dbc8686866040518463ffffffff1660e060020a0281526004018084600160a060020a0316600160a060020a031681526020018060200180602001838103835285818151815260200191508051906020019060200280838360005b83811015610fe3578181015183820152602001610fcb565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561102257818101518382015260200161100a565b5050505090500195505050505050602060405180830381600087803b15801561104a57600080fd5b505af115801561105e573d6000803e3d6000fd5b505050506040513d602081101561107457600080fd5b50519150600101610f25565b509392505050565b3360009081526001602081905260408220015460ff16151561111a576040805160e560020a62461bcd02815260206004820152602860248201527f4f6e6c7920726567697374657265642072756c6520697320616c6c6f7765642060448201527f746f2063616c6c2e000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600160a060020a03861660009081526006602052604090205460ff1615156111b2576040805160e560020a62461bcd02815260206004820152602b60248201527f5472616e73666572732066726f6d20746865206164647265737320617265206e60448201527f6f7420616c6c6f7765642e000000000000000000000000000000000000000000606482015290519081900360840190fd5b83821461122f576040805160e560020a62461bcd02815260206004820152603960248201527f27746f2720616e642027616d6f756e7427207472616e7366657220617272617960448201527f7327206c656e6774687320617265206e6f7420657175616c2e00000000000000606482015290519081900360840190fd5b611291868686808060200260200160405190810160405280939291908181526020018383602002808284375050604080516020808c0282810182019093528b82529095508b94508a935083925085019084908082843750610f20945050505050565b15156112e7576040805160e560020a62461bcd02815260206004820152601b60248201527f436f6e73747261696e7473206e6f742066756c6c66696c6c65642e0000000000604482015290519081900360640190fd5b5060005b838110156113d557600554600160a060020a03166323b872dd8787878581811061131157fe5b90506020020135600160a060020a0316868686818110151561132f57fe5b905060200201356040518463ffffffff1660e060020a0281526004018084600160a060020a0316600160a060020a0316815260200183600160a060020a0316600160a060020a031681526020018281526020019350505050602060405180830381600087803b1580156113a157600080fd5b505af11580156113b5573d6000803e3d6000fd5b505050506040513d60208110156113cb57600080fd5b50506001016112eb565b505050600160a060020a039092166000908152600660205260409020805460ff191690555050565b6003545b90565b6001602081905260009182526040909120805491015460ff1682565b600554600160a060020a031681565b60005b6003548110801561146f575081600160a060020a031660038281548110151561145757fe5b600091825260209091200154600160a060020a031614155b1561147c57600101611432565b919050565b60035460009082106114dd576040805160e560020a62461bcd02815260206004820152601660248201527f496e646578206973206f7574206f662072616e67652e00000000000000000000604482015290519081900360640190fd5b506003805460001981019190829081106114f357fe5b60009182526020909120015460038054600160a060020a03909216918490811061151957fe5b6000918252602090912001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055600380546000190190611562908261161b565b505050565b6040805160608181018352808252600060208301529181019190915290565b604080518082019091526000808252602082015290565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106115de57805160ff191683800117855561160b565b8280016001018555821561160b579182015b8281111561160b5782518255916020019190600101906115f0565b5061161792915061163b565b5090565b815481835581811115611562576000838152602090206115629181019083015b61140191905b8082111561161757600081556001016116415600a165627a7a7230582036d52a4f0251d9dceb691905e1408a2cda80d21c74460f49b9c7b87607c92ac50029'
);
AbiBinProvider.prototype.addBIN(
  'TransferRule',
  '608060405234801561001057600080fd5b506040516020806103898339810160405251600160a060020a038116151561009957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f546f6b656e2072756c65732061646472657373206973206e756c6c2e00000000604482015290519081900360640190fd5b60008054600160a060020a03909216600160a060020a03199092169190911790556102c0806100c96000396000f3006080604052600436106100405763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166323b872dd8114610045575b600080fd5b34801561005157600080fd5b5061007c73ffffffffffffffffffffffffffffffffffffffff60043581169060243516604435610090565b604080519115158252519081900360200190f35b604080516001808252818301909252600091606091829160208083019080388339019050509150848260008151811015156100c757fe5b73ffffffffffffffffffffffffffffffffffffffff929092166020928302919091018201526040805160018082528183019092529182810190803883390190505090508381600081518110151561011a57fe5b90602001906020020181815250506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a6a192da8784846040518463ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156102095781810151838201526020016101f1565b50505050905001838103825284818151815260200191508051906020019060200280838360005b83811015610248578181015183820152602001610230565b5050505090500195505050505050600060405180830381600087803b15801561027057600080fd5b505af1158015610284573d6000803e3d6000fd5b50600199985050505050505050505600a165627a7a723058206406ad8e7ec59e3f46c303200f4ff8e1fd42d941c9eec45427c763c349dcf8f90029'
);
