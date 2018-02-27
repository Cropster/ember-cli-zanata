'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Promise } = require('rsvp');
const stringUtil = require('ember-cli-string-utils');
const { ZanataClient } = require('zanata-js');
const getCurrentVersion = require('./../utils/get-current-version');

/**
 * Abstract command class. Refer to current implementation of Ember CLI at:
 * https://github.com/ember-cli/ember-cli/blob/master/lib/models/command.js
 *
 * @class Abstract
 * @namespace Command
 * @abstract
 * @protected
 */
module.exports = {

  works: 'insideProject',

  /**
   * Collection of available options. An option should look like:
   *
   * ```
   *   {
   *     type: <T>,
   *     name: String,
   *     default: String,
   *     aliases:[]<String>,
   *     description: String
   *   }
   * ```
   *
   * @property availableOptions
   * @type {Array}
   * @public
   */
  availableOptions: [],

  /**
   * Tries to extend `availableOptions` with globals from config.
   *
   * @method beforeRun
   * @public
   */
  beforeRun() {
    this._super.apply(this, arguments);

    // try to read global options from `config/zanata.js`
    let configOptions = {};
    let module = path.join(this.project.root, 'config', 'zanata');

    try {
      configOptions = require(module);
      if (typeof configOptions === 'function') {
        configOptions = configOptions();
      }
    } catch(e) {
      // do nothing, ignore the config
    }

    // For all options that are specified in config/coverage.js, set the value there to be the actual default value
    this.availableOptions.map((option) => {
      let normalizedName = stringUtil.camelize(option.name);
      let configOption = configOptions[normalizedName];

      if (configOption !== undefined) {
        option.default = configOption;
        return option;
      }

      return option;
    });
  },

  /**
   * Run `start()` after setting up the options.
   * Also, time out after 5 minutes (if something goes wrong).
   *
   * @method run
   * @param {Object} options
   * @param {String[]} positionalArguments
   * @return {Promise}
   * @public
   */
  run(options, positionalArguments) {
    options.version = this._getVersion(options);
    let promise = this.start(options, positionalArguments);

    return new Promise((resolve, reject) => {
      promise.then(resolve, reject);

      // Also just time out after 5 minutes
      setTimeout(reject, 5 * 60 * 1000);
    });
  },

  /**
   * Template method for implementing actual logic after checks.
   * Override this in sub-classes.
   *
   * @public
   * @method start
   * @return {RSVP.Promise}
   */
  start() {
    throw new Error(`command must implement start() when not overriding run()!`);
  },

  _getProject(options) {
    let projectOptions = this._getProjectOptions(options);
    return new ZanataClient.Project(projectOptions);
  },

  _logError(str) {
    console.log(chalk.red(str)); // eslint-disable-line
  },

  _logSuccess(str) {
    console.log(chalk.green(str)); // eslint-disable-line
  },

  _logWarn(str) {
    console.log(chalk.yellow(str)); // eslint-disable-line
  },

  _log(str) {
    console.log(str); // eslint-disable-line
  },

  /**
   * Get the options from the options array to use for the project setup.
   *
   * @method _getProjectOptions
   * @param {Object} options
   * @return {Object}
   * @private
   */
  _getProjectOptions(options) {
    // Manually remove these, as they come from ember-cli
    let projectOptionNames = ['username', 'url', 'apiKey'];

    let parsedOptions = {};

    projectOptionNames.forEach((optionName) => {
      parsedOptions[stringUtil.dasherize(optionName)] = options[optionName];
    });

    return parsedOptions;
  },

  /**
   * Parse the options to use for Zanata.
   *
   * @method _parseZanataOptions
   * @param {Object} options
   * @returns {Object}
   * @private
   */
  _parseZanataOptions(options) {
    // Manually remove these, as they come from ember-cli / are for the project
    let ignoredOptions = ['checkForUpdates', 'disableAnalytics', 'username', 'apiKey', 'url'];

    let parsedOptions = {};

    Object.keys(options).forEach((optionName) => {
      if (ignoredOptions.includes(optionName)) {
        return;
      }

      parsedOptions[stringUtil.dasherize(optionName)] = options[optionName];
    });

    return parsedOptions;
  },

  /**
   * Get the actual version to use.
   * If the version is "current", use the version from the package.json instead.
   *
   * @method _getVersion
   * @param {Object} options
   * @return {String}
   * @private
   */
  _getVersion(options) {
    let { version } = options;
    if (version === 'current') {
      return getCurrentVersion();
    }
    return version;
  },

  /**
   * This method can be used by sub-classes to transform a whole array of locales to be used by Zanata.
   *
   * @method parseLocalesForZanata
   * @param {String[]} locales
   * @param {Object} options
   * @return {String[]}
   * @protected
   */
  parseLocalesForZanata(locales, options) {
    let replaceFunc = options.getZanataLocaleFunction || ((locale) => locale);
    return locales.map(replaceFunc);
  },

  /**
   * This method can be used by sub-classes to transform a whole array of locales coming from Zanata to be used locally.
   *
   * @method parseLocaleFromZanata
   * @param {String[]} locales
   * @param {Object} options
   * @return {String[]}
   * @protected
   */
  parseLocaleFromZanata(locales, options) {
    let replaceFunc = options.parseZanataLocaleFunction || ((locale) => locale);
    return locales.map(replaceFunc);
  },

  /**
   * Create a tmp folder to put files from/to Zanata into.
   * It is assumed that this is one level deep in the ./tmp folder.
   *
   * @method _createTmpFolder
   * @param {String} tmpDir
   * @protected
   */
  _createTmpFolder(tmpDir) {
    let fullTmpDirPath = path.join(tmpDir);

    if (!fs.existsSync('tmp')) {
      fs.mkdirSync('tmp');
    }
    if (!fs.existsSync(fullTmpDirPath)) {
      fs.mkdirSync(fullTmpDirPath);
    }
  },

  /**
   * Clean up the tmp folder.
   *
   * @method _cleanupTmpFolder
   * @param {String} tmpDir
   * @protected
   */
  _cleanupTmpFolder(tmpDir) {
    let fullTmpDirPath = path.join(tmpDir);
    let files = fs.readdirSync(fullTmpDirPath);
    files.forEach((file) => {
      fs.unlinkSync(path.join(fullTmpDirPath, file));
    });
    fs.rmdirSync(fullTmpDirPath);
  }
};
