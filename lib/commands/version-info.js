'use strict';

const { Promise } = require('rsvp');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

/**
 * Show information for a version of a project.
 *
 * This is mainly the available locales.
 *
 * `ember zanata:version-info --version="XXX"`
 *
 * Will print something like this:
 *
 * ```sh
 * Version 1.0.10 for project my-project was successfully loaded
 * It has the following locales:
 * en: English
 * zh-Hans: Chinese (Simplified)
 * zh-Hant: Chinese (Traditional)
 * de: German
 * ```
 *
 * @class VersionInfo
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:version-info',
  description: 'Show information for a specific version of a project',

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
    },
    {
      name: 'version',
      type: String,
      aliases: ['v'],
      description: 'The version to use',
      required: true
    }
  ],

  start(options) {
    let { projectId, version } = options;

    return new Promise((resolve, reject) => {
      this._getProject(options)
        .on('fail', (error) => {
          this._logError(`An error occurred when loading the version ${version} for ${projectId}.`);
          this._logError(error);
          reject(error);
        })
        .on('data_version_info', (data) => {
          let locales = data.locales.filter((locale) => locale.enabled);

          this._logSuccess(`Version ${version} for project ${projectId} was successfully loaded`);
          this._log(`It has the following locales:`);

          locales.forEach((locale) => {
            this._log(`${locale.localeId}: ${locale.displayName}`);
          });

          resolve(data)
        }).versionInfo(projectId, version, true);
    });
  }

});
