'use strict';

const parseFile = function (filePath, options) {
  filePath = path.join(filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
};

const Abis = function () {};

Abis.prototype = {
  mockToken: parseFile('../../contracts/abi/MockToken.abi', 'utf8')
};

module.exports = new Abis();