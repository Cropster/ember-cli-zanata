'use strict';

const path = require('path');
const fs = require('fs');
const { Promise } = require('rsvp');
const AbstractCommand = require('./abstract');
const BaseCommand = Object.create(AbstractCommand);
const pull = require('./../utils/pull');

/**
 * Pull translation data from Zanata.
 * This can pull translation files, source files, or both.
 * Don't forget to specify a version & project to pull from!
 *
 * You'll also need to specify the list of locales to pull.
 * It is recommended to put those (along with the project-id) in the `config/zanata.js` file.
 *
 *  * Pull translation files only: `ember zanata:pull`
 *  * Pull all files: `ember zanata:pull --update-type=both`
 *  * Pull source files only: `ember zanata:pull --update-type=source`
 *
 * @class Pull
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:pull',
  description: 'Pull data from Zanata into your local folder.',

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
      description: 'The folder where the translations should be put into'
    },
    {
      name: 'locales',
      type: Array,
      aliases: ['l'],
      default: ['en'],
      description: 'An array of locales to use.'
    },
    {
      name: 'update-type',
      type: String,
      aliases: ['ut'],
      default: 'trans',
      description: 'Which files should be pulled. "both" for all, "source" for source files only, "trans" for translated files only.'
    },
    { name: 'tmp-dir', type: String, default: './tmp/.zanata' },
    { name: 'parse-zanata-locale-function', type: Function, default: (locale) => locale.replace('-', '_') },
  ],

  start(options) {
    options.locales = this.parseLocalesForZanata(options.locales, options);

    let { version, projectId } = options;
    let project = this._getProject(options);

    return new Promise((resolve, reject) => {
      this._prepareFolder(options).then(() => {
        return pull(project, options);
      }).then(() => {
        return this._moveToOutput(options);
      }).then(() => {
        // Wait for 1ms, to fix etag issues
        return new Promise((r) => setTimeout(r, 1));
      }).then(() => {
        this._logSuccess(`The version ${version} was successfully pulled for ${projectId}`);
        this._cleanupTmpFolder(options.tmpDir);
        resolve();
      }).catch((error) => {
        this._logError(`An error occurred when pulling version ${version} for ${projectId}.`);
        this._logError(error);
        this._cleanupTmpFolder(options.tmpDir);
        reject(error);
      });
    });
  },

  /**
   * Move the pulled files from the tmp folder to the actual translation folder.
   *
   * @method _moveToOutput
   * @param {Object} options
   * @private
   */
  _moveToOutput(options) {
    let { tmpDir, translationFolder } = options;

    return new Promise((resolve) => {
      let fullTmpDirPath = path.join(tmpDir);
      let files = fs.readdirSync(fullTmpDirPath);
      files.forEach((file) => {
        let filePath = path.join(fullTmpDirPath, file);
        let newFileName = null;

        if (file.includes('.pot')) {
          newFileName = file;
        } else if (file.includes('.po')) {
          let [locale] = file.split('.po');
          newFileName = `${options.parseZanataLocaleFunction(locale)}.po`;
        }

        if (newFileName) {
          fs.copyFileSync(filePath, path.join(translationFolder, newFileName));
        }
      });

      resolve();
    });
  },

  /**
   * Prepare the tmp folder.
   *
   * @method _prepareFolder
   * @param {Object} options
   * @return {RSVP.Promise}
   * @private
   */
  _prepareFolder(options) {
    let { tmpDir } = options;

    return new Promise((resolve) => {
      this._createTmpFolder(tmpDir);
      resolve();
    });
  }

});
