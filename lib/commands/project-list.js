'use strict';

const { Promise } = require('rsvp');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

/**
 * Display a list of all active projects available.
 *
 * `ember zanata:project-list`
 *
 * @class ProjectList
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:project-list',
  description: 'List all projects',

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
    }
  ],

  start(options) {
    return new Promise((resolve, reject) => {
      this._getProject(options)
        .on('fail', (error) => {
          this._logError('An error occurred when loading the projects.');
          this._logError(error);
          reject(error);
        })
        .on('data_list', (data) => {
          let activeProjects = data.filter((project) => project.status === 'ACTIVE');
          this._logSuccess(`${activeProjects.length} active projects were found:`);
          activeProjects.forEach((project) => {
            this._log(`${project.name} (${project.id})`);
          });
          resolve(data)
        }).list(['id', 'name', 'defaultType', 'status']);
    });
  }

});
