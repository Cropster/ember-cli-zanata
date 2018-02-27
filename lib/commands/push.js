'use strict';

const { Promise } = require('rsvp');
const path = require('path');
const fs = require('fs');
const AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);
const push = require('./../utils/push');

/**
 * Pull translation data from Zanata.
 * This can pull translation files, source files, or both.
 * Don't forget to specify a version & project to pull from!
 *
 * You'll also need to specify the list of locales to pull.
 * It is recommended to put those (along with the project-id) in the `config/zanata.js` file.
 *
 *  * Push all files: `ember zanata:push`
 *  * Push translation files only: `ember zanata:push --update-type=trans`
 *  * Push source files only: `ember zanata:push --update-type=source`
 *
 * Note that the Zanata API is a bit flaky. Because of this, this will try to push a few times - by default, 4 times.
 * Only if it fails 4 times, will it error out.
 *
 * @class Push
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:push',
  description: 'Update a version with data from your locale folder.',

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
      name: 'translation-folder',
      type: String,
      aliases: ['t'],
      default: './translations',
      description: 'The folder where the translations are'
    },
    {
      name: 'locales',
      type: Array,
      aliases: ['l'],
      default: ['en'],
      description: 'An array of locales to use.'
    },
    {
      name: 'exclude-files',
      type: Array,
      aliases: ['e'],
      default: ['excluded.pot'],
      description: 'An array of files to ignore from the source folder.'
    },
    {
      name: 'update-type',
      type: String,
      aliases: ['ut'],
      default: 'both',
      description: 'Which files should be pushed. "both" for all, "source" for source files only, "trans" for translated files only.'
    },
    {
      name: 'try-count',
      type: Number,
      aliases: ['tc'],
      default: 4,
      description: 'How often we want to try to push. The Zanata API is a bit flaky, so we want to try multiple times.'
    },
    { name: 'tmp-dir', type: String, default: './tmp/.zanata' },
    { name: 'get-zanata-locale-function', type: Function, default: (locale) => locale.replace('_', '-') }
  ],

  start(options) {
    options.locales = this.parseLocalesForZanata(options.locales, options);

    let { version, projectId } = options;
    let project = this._getProject(options);

    return new Promise((resolve, reject) => {
      this._prepareFolder(options).then(() => {
        this._tryPushCount = 0;
        return this._tryPush(project, options);
      }).then((data) => {
        this._logSuccess(`The version ${version} was successfully updated for ${projectId}`);
        this._cleanupTmpFolder(options.tmpDir);
        resolve(data);
      }).catch((error) => {
        this._logError(`An error occurred when updating version ${version} for ${projectId}.`);
        this._logError(error);
        this._cleanupTmpFolder(options.tmpDir);
        reject(error);
      });
    });
  },

  _tryPushCount: 0,

  /**
   * Try to push.
   * This will recursively try to push until the try-count is reached.
   *
   * @method _tryPush
   * @param {ZanataClient.Project} project
   * @param {Object} options
   * @return {RSVP.Promise}
   * @private
   */
  _tryPush(project, options) {
    this._tryPushCount++;
    let maxCount = options.tryCount;

    return new Promise((resolve, reject) => {
      push(project, options).then(resolve).catch((error) => {
        if (this._tryPushCount >= maxCount) {
          reject(error);
        } else {
          this._log(`Version update failed (try #${this._tryPushCount}), trying again...`);
          this._tryPush(project, options).then(resolve).catch(reject);
        }
      });
    });
  },

  /**
   * Prepare the tmp folder.
   * This moves the file from the translation folder over, and renames them appropriately.
   *
   * @method _prepareFolder
   * @param {Object} options
   * @return {RSVP.Promise}
   * @private
   */
  _prepareFolder(options) {
    let { translationFolder, tmpDir } = options;

    return new Promise((resolve) => {
      this._createTmpFolder(tmpDir);

      // Copy files over
      let files = fs.readdirSync(path.join(translationFolder));
      files.forEach((file) => {
        let filePath = path.join(translationFolder, file);
        let newFileName = null;

        // Ignore these
        if (options.excludeFiles.includes(file)) {
          return;
        }

        if (file.endsWith('.pot')) {
          newFileName = file;
        } else if (file.endsWith('.po')) {
          let [locale] = file.split('.po');
          // We need to replace - with _
          // Zanata locale-ids use - (e.g. zh-Hans), but zanata-js expects files to have underscores (e.g. zh_Hans)
          let fileName = options.getZanataLocaleFunction(locale).replace('-', '_');
          newFileName = `${fileName}.po`;
        }

        if (newFileName) {
          fs.copyFileSync(filePath, path.join(tmpDir, newFileName));
        }
      });

      resolve();
    });
  }


});
