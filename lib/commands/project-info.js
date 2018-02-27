'use strict';

const { Promise } = require('rsvp');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

/**
 * Display information for a given project.
 *
 * `ember zanata:project-info --project-id="XXX"`
 *
 * @class ProjectInfo
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:project-info',
  description: 'Show information for a specific project',

  availableOptions: [
    {
      name: 'username',
      type: String,
      aliases: ['U'],
      description: 'The Zanata user to use',
      required: true
    },
    {
      name: 'url',
      type: String,
      aliases: ['u'],
      description: 'The URL to the Zanata server',
      required: true
    },
    {
      name: 'api-key',
      type: String,
      aliases: ['key', 'api', 'K'],
      description: 'The API key for the Zanata server',
      required: true
    },
    {
      name: 'project-id',
      type: String,
      aliases: ['p'],
      description: 'The project id to use',
      required: true
    }
  ],

  start(options) {
    let { projectId } = options;

    return new Promise((resolve, reject) => {
      this._getProject(options)
        .on('fail', (error) => {
          this._logError(`An error occurred when loading the project ${projectId}.`);
          this._logError(error);
          reject(error);
        })
        .on('data_info', (data) => {
          let versions = data.versions.filter((version) => version.status === 'ACTIVE');

          let lastVersion = versions[versions.length - 1];
          this._logSuccess(`Project ${projectId} was successfully loaded`);
          this._log(`Project name: ${data.name}`);
          this._log(`Latest version: ${lastVersion.id}`);

          resolve(data)
        }).info(projectId);
    });
  }

});
