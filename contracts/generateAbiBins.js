/**
 * Generates ABI/BIN using truffle compile.
 *
 * 1. Clone openst-contracts
 * 2. Checkout develop or any branch of your liking.
 * 3. run: ./node_modules/.bin/truffle compile
 * 4. Come back to openst.js/contracts
 * 5. run: node ./generateAbiBins.js
 * 6. Make sure commit only the contracts that are needed.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

let contractsRepoPath = path.join(os.homedir(), './openst-contracts/build/contracts/');
let abiOutputPath = path.join(os.homedir(), './openst-contracts/build/abi');
let binOutputPath = path.join(os.homedir(), './openst-contracts/build/bin');
console.log('dir path :- ', os.homedir());
console.log('path path :- ', contractsRepoPath);
if (process.argv.length > 2) {
  contractsRepoPath = process.argv[2];
}

console.log(`Looking for truffle compile output in path ${contractsRepoPath}`);

let metadata = {
  abi: {
    generated: [],
    ignored: []
  },
  bin: {
    generated: [],
    ignored: []
  },
  total: 0
};

//Read all files.
fs.readdir(contractsRepoPath, function(err, items) {
  metadata.total = items.length;
  for (var i = 0; i < items.length; i++) {
    let fileName = items[i];
    if (!fileName.endsWith('.json')) {
      //Do nothing
      continue;
    }

    //Determine file Name
    let fileSplits = fileName.split('.');
    if (fileSplits.length > 2) {
      throw `Unexpected File Name ${fileName}`;
    }

    let contractName = fileSplits[0];

    if (contractName.startsWith('Mock') || contractName.startsWith('Test')) {
      //Skip it.
      metadata.abi.ignored.push(contractName);
      metadata.bin.ignored.push(contractName);
      continue;
    }

    console.log(`Processing ${fileName}`);

    let jsonFilePath = path.join(contractsRepoPath, fileName);
    console.log(`jsonFilePath ${jsonFilePath}`);
    let json = require(jsonFilePath);

    //Generate Abi files
    if (json.abi && json.abi.length) {
      console.log('--- Generating abi file');
      //Write to file.
      let fileContent = JSON.stringify(json.abi);
      let outputFile = path.join(abiOutputPath, contractName + '.abi');
      fs.writeFileSync(outputFile, fileContent);
      //Update Metadata
      metadata.abi.generated.push(contractName);
    } else {
      console.log('--- abi file not generated');
      metadata.abi.ignored.push(contractName);
    }

    //Generate Bin files
    if (json.bytecode && json.bytecode.length && json.bytecode != '0x') {
      console.log('--- Generating bin file');
      //Write to file.
      let fileContent = json.bytecode;
      let outputFile = path.join(binOutputPath, contractName + '.bin');
      fs.writeFileSync(outputFile, fileContent);
      //Update Metadata
      metadata.bin.generated.push(contractName);
    } else {
      console.log('--- bin file not generated');
      metadata.bin.ignored.push(contractName);
    }
  }

  console.log('------ Task Completed ------');
  console.log('Total truffle Artifacts:', metadata.total);
  console.log(
    'Abi File generated for',
    metadata.abi.generated.length,
    'contracts. Artifacts can be found here: ',
    abiOutputPath
  );
  console.log(
    'Bin generated for',
    metadata.bin.generated.length,
    'contracts. Artifacts can be found here: ',
    binOutputPath
  );
  if (metadata.abi.ignored.length) {
    console.log('Abi generation ignored for \n\t', metadata.abi.ignored.join('\n\t '));
  }
  if (metadata.bin.ignored.length) {
    console.log('Bin generation ignored for \n\t', metadata.bin.ignored.join('\n\t '));
  }
});
