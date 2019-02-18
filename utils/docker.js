// / Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');
const config = require('./configReader');

const composeFilePath = path.join(__dirname, './docker-compose.yml');
const asyncSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// docker-compose is expected to be available in the test environment
//    (e.g., it is installed automatically in Travis CI's "trusty" build)
const dockerSetup = () => {
  const dockerCompose = childProcess.spawn('docker-compose', ['-f', composeFilePath, 'up', '--force-recreate']);

  if (process.env.TEST_STDOUT) {
    dockerCompose.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    dockerCompose.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  }

  const waitForOriginNode = waitPort({ port: config.originPort, output: 'silent' });
  return Promise.all([waitForOriginNode])
    .then(() => asyncSleep(5000))
    .then(() => ({
      rpcEndpointOrigin: `http://localhost:${config.originPort}`
    }));
};

const dockerTeardown = () => {
  const dockerComposeDown = childProcess.spawnSync('docker-compose', ['-f', composeFilePath, 'down']);
  if (process.env.TEST_STDOUT) {
    process.stdout.write(dockerComposeDown.stdout);
    process.stderr.write(dockerComposeDown.stderr);
  }
};

module.exports = {
  asyncSleep,
  dockerSetup,
  dockerTeardown
};
