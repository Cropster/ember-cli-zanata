'use strict';

const { Promise } = require('rsvp');
const AbstractCommand = require('./abstract');
const shelljs = require('shelljs');
let BaseCommand = Object.create(AbstractCommand);

/**
 * Create a new version for a project.
 *
 * `ember zanata:version-create --version="XXX"`
 *
 * By default, it will push all files (sources & translations!) after successfully creating a new version.
 * You can deactivate that behaviour like this:
 *
 * `ember zanata:version-create --version="XXX" --update-if-new=false`
 *
 * Additionally, if the version you are trying to create already exists, it will throw an error.
 * You can supress that with:
 *
 * `ember zanata:version-create --version="XXX" -resolve-if-exists=true`
 *
 * This will then just print out a message that the version already exists, but exit with a success code.
 *
 * @class VersionCreate
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:version-create',
  description: 'Create a new version for a project',

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
      description: 'The version to create',
      required: true
    },
    {
      name: 'resolve-if-exists',
      type: Boolean,
      aliases: ['rie'],
      default: false,
      description: 'If set to true, do not cancel out if the version already exists, but just do nothing'
    },
    {
      name: 'update-if-new',
      type: Boolean,
      aliases: ['uin'],
      default: true,
      description: 'If it should immediately update the sources, if a new translation was created'
    }
  ],

  start(options) {
    let { projectId, version } = options;

    let project = this._getProject(options);

    return new Promise((resolve, reject) => {
      project
        .on('fail', (error) => {
          if (options.resolveIfExists && error.toString() === `Error: Version '${version}' already exists`) {
            this._logSuccess(`The version ${version} already exists for ${projectId}`);
            resolve(error);
            return;
          }

          this._logError(`An error occurred when creating new version ${version} for ${projectId}.`);
          this._logError(error);
          reject(error);
        })
        .on('data_create', (data) => {
          this._logSuccess(`The version ${version} was successfully created for ${projectId}`);

          if (!options.updateIfNew) {
            this._logSuccess(`Run ember zanata:push --version="${version}" to initialise the version.`);
            resolve(data);
            return;
          }

          this._log('Now, push the current translation files...');
          shelljs.exec(`ember zanata:push --version="${version}" --project-id="${projectId}"`, (code, stdout, stderr) => {
            if (code === 0) {
              this._logSuccess(`All done! The new version ${version} is now ready to be translated.`);
              resolve(stdout);
            } else {
              reject(stderr || stdout);
            }
          });

        }).createVersion(projectId, version, { projectType: 'gettext' });
    });
  }
});
