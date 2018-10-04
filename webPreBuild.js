#!/usr/bin/env node

const fs = require('fs'),
  rootPrefix = '.',
  paths = ['/contracts/abi', '/contracts/bin'],
  readableFile = rootPrefix + '/utils/AbiBinProvider.js',
  writableFile = rootPrefix + '/tmp/AbiBinProvider.js',
  protoToAddData = 'AbiBinProvider.prototype',
  addAbiFuncName = 'addABI',
  addBinFuncName = 'addBIN';

let fileInsertContents = [];

function prepareData(option) {
  var fileContent = null,
    dirFilePath = null,
    readFilePath = null,
    option = option || 'utf8',
    insertContent = null;
  paths.forEach(function(path) {
    dirFilePath = rootPrefix + path;
    fs.readdir(dirFilePath, function(err, items) {
      items.forEach(function(item) {
        readFilePath = rootPrefix + path + '/' + item;
        fileContent = fs.readFileSync(readFilePath, option);
        try {
          JSON.parse(fileContent);
        } catch (e) {
          fileContent = '"' + fileContent + '"';
        }
        createAddFun(item, fileContent);
      });
    });
  });
}

function createAddFun(item, fileContent) {
  const separator = '.',
    splitted = item.split(separator),
    name = "'" + splitted[0] + "'",
    fileType = splitted[1],
    openBracket = '(',
    closeBracket = ')',
    paramsSeparator = ' , ',
    funcName = fileType == 'abi' ? addAbiFuncName : addBinFuncName,
    content = protoToAddData + separator + funcName + openBracket + name + paramsSeparator + fileContent + closeBracket;
  fileInsertContents.push(content);
}

function writeToFile() {
  fs.readFile(readableFile, 'utf8', function(err, data) {
    const startDelimiter = '//__WEB_SAFE_SPACE_BEGINS__',
      endDelimiter = '//__WEB_SAFE_SPACE_ENDS__',
      newline = '\r\n',
      regexPattern = startDelimiter + '.*?' + endDelimiter,
      semicolon = ';';

    let replaceRegex = new RegExp(regexPattern, 's');
    if (!replaceRegex.test(data)) {
      throw ' -- Error in prescript content replace, someone changed the comments ' +
        startDelimiter +
        ' ' +
        endDelimiter;
    }

    let fileContent =
        startDelimiter + newline + fileInsertContents.join(semicolon + newline) + semicolon + newline + endDelimiter,
      result = data.replace(replaceRegex, fileContent);

    fs.writeFileSync(writableFile, result);
  });
}

function appendToFile() {
  fs.readFile(readableFile, 'utf8', function(err, data) {
    const newline = '\r\n';

    let semicolon = ';',
      extraContent = newline + fileInsertContents.join(semicolon + newline) + semicolon,
      result = data + newline + extraContent;

    fs.writeFileSync(writableFile, result);
  });
}

function modifyFile() {
  prepareData();
  appendToFile();
}

modifyFile();
