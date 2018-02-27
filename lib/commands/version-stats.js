'use strict';

const { Promise } = require('rsvp');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

/**
 * Show translation stats for a version of a project.
 *
 * `ember zanata:version-stats --version="XXX"`
 *
 * Will print something like this:
 *
 * ```sh
 * Translation progress for version 1.0.10 of project my-project (document messages): 81.65%
 * en: 100.00% (1064/1064) of phrases translated
 * zh-Hans: 98.03% (1043/1064) of phrases translated
 * zh-Hant: 98.03% (1043/1064) of phrases translated
 * de: 30.55% (325/1064) of phrases translated
 * ```
 *
 * @class VersionStats
 * @namespace Command
 * @extends Command.Abstract
 * @public
 */
module.exports = Object.assign(BaseCommand, {

  name: 'zanata:version-stats',
  description: 'Show translation progress for a specific version of a project',

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

      this._loadSources(options).then((sources) => {
        return Promise.all(sources.map((source) => {
          return this._loadDocumentStats(projectId, version, source.name, options);
        }));
      }).then(resolve).catch(reject);
    });
  },

  /**
   * Load the document stats for a given document.
   *
   * @method _loadDocumentStats
   * @param {String} projectId
   * @param {String} version
   * @param {String} documentId
   * @param {Object} options
   * @return {RSVP.Promise}
   * @private
   */
  _loadDocumentStats(projectId, version, documentId, options) {
    return new Promise((resolve, reject) => {
      this._getProject(options)
        .on('fail', (error) => {
          this._logError(`An error occurred when loading the stats for version ${version} of ${projectId}.`);
          this._logError(error);
          reject(error);
        })
        .on('data_stats', (data) => {
          let wordStats = data.stats.filter((stat) => stat.unit === 'WORD');

          let total = wordStats.reduce((total, item) => total + item.total, 0);
          let translated = wordStats.reduce((total, item) => total + item.translated, 0);
          let percentage = (translated / total * 100).toFixed(2);

          this._logSuccess(`Translation progress for version ${version} of project ${projectId} (document ${documentId}): ${percentage}%`);

          wordStats.forEach((localeInfo) => {
            let { total, translated, locale } = localeInfo;
            let percentageNumber = translated / total * 100;
            let percentage = percentageNumber.toFixed(2);

            if (percentageNumber > 95) {
              this._log(`${locale}: ${percentage}% (${translated}/${total}) of phrases translated`);
            } else if (percentageNumber > 80) {
              this._logWarn(`${locale}: ${percentage}% (${translated}/${total}) of phrases translated`);
            } else {
              this._logError(`${locale}: ${percentage}% (${translated}/${total}) of phrases translated`);
            }
          });

          resolve(data)
        }).stats(projectId, version, documentId, { word: true });
    });
  },

  /**
   * Load the sources for a given version of a project.
   *
   * @method _loadSources
   * @param {Object} options
   * @return {RSVP.Promise}
   * @private
   */
  _loadSources(options) {
    let { projectId, version } = options;
    if (!projectId) {
      return Promise.reject('You need to specify a projectId.')
    }
    if (!version) {
      return Promise.reject('You need to specify a version.')
    }
    return new Promise((resolve, reject) => {
      this._getProject(options)
        .on('fail', (error) => {
          this._logError(`An error occurred when loading the documents for ${version} of ${projectId}.`);
          this._logError(error);
          reject(error);
        })
        .on('end_pull', (data) => {
          resolve(data)
        }).pullSources(projectId, version, {});
    });
  }

});
