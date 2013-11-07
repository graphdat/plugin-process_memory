#!/bin/bash
echo Installing node modules
npm install

echo Building SIGAR
cd node_modules/sigar
node-waf configure