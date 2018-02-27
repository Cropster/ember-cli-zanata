'use strict';

const { Promise } = require('rsvp');

module.exports = function(project, options) {
  let { projectId, version } = options;

  let params = {
    project: projectId,
    version,
    pushType: options.updateType || 'both',
    locales: options.locales || ['en'],
    copyTrans: true,
    projectType: 'gettext',
    podir: options.tmpDir,
    potdir: options.tmpDir
  };

  return new Promise((resolve, reject) => {
    project
      .on('fail', (error) => {
        reject(error);
      })
      .on('end_push', (data) => {
        resolve(data)
      }).push(params);
  });
};
