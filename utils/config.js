'use strict';

/* jshint esnext: true, node:true, unused: true */

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const expandHomeDir = require('expand-home-dir');
const HOMEDIR = expandHomeDir('~');
const CONFIG_FILE = '.rnplay';
const CONFIG_FILE_PATH = path.join(HOMEDIR, CONFIG_FILE);
const CONFIG_FILE_PATH_LOCAL = path.join(process.cwd(), CONFIG_FILE);

const writeFileAsync = Promise.promisify(fs.writeFile, fs);
const readFileAsync = Promise.promisify(fs.readFile, fs);

const readJSON = (path, msg) => () => {
  return readFileAsync(path)
  .then((contents) => {
    return JSON.parse(contents);
  })
  .catch((e) => {
    throw new Error(msg);
  });
};
const writeJSON = (path) => (obj) => {
  return writeFileAsync(path, JSON.stringify(obj) + '\n');
};

const readConfig = readJSON(CONFIG_FILE_PATH, 'Missing or corrupt config file, please run `rnplay -a`');
const saveConfig = writeJSON(CONFIG_FILE_PATH);

const saveLocalConfig = writeJSON(CONFIG_FILE_PATH_LOCAL);
const readLocalConfig = readJSON(CONFIG_FILE_PATH_LOCAL, 'Missing or corrupt local config file, please run `rnplay -c`');

module.exports = {
  readConfig: readConfig,
  saveConfig: saveConfig,
  readLocalConfig: readLocalConfig,
  saveLocalConfig: saveLocalConfig
};
