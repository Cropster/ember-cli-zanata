'use strict';

const { Promise } = require('rsvp');
const fs = require('fs');
const path = require('path');

module.exports = function(project, options) {
  let { projectId, version } = options;

  let params = {
    project: projectId,
    version,
    pullType: options.updateType || 'both',
    locales: options.locales || ['en'],
    podir: options.tmpDir,
    potdir: options.tmpDir,
    force: true
  };

  return new Promise((resolve, reject) => {
    project
      .on('fail', (error) => {
        reject(error);
      })
      .on('data_pull', (item) => {
        let fileName = item.type === 'pot' ? `${item.name}.pot` : `${item.locale}.po`;
        let filePath = path.join(options.tmpDir, fileName);
        fs.writeFileSync(filePath, item.data);
      })
      .on('end_pull', (data) => {
        resolve(data)
      }).pull(params);
  });
};
