'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function() {
  let packageJsonPath = path.join('./package.json');

  try {
    let file = fs.readFileSync(packageJsonPath, 'utf8');
    let jsonSummary = JSON.parse(file);
    return jsonSummary.version;
  } catch(e) {
    return null;
  }
};
