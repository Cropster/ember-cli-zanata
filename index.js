'use strict';

module.exports = {
  name: 'ember-cli-zanata',

  includedCommands: function() {
    return {
      'zanata:project-list': require('./lib/commands/project-list'),
      'zanata:project-info': require('./lib/commands/project-info'),
      'zanata:version-info': require('./lib/commands/version-info'),
      'zanata:version-stats': require('./lib/commands/version-stats'),
      'zanata:version-create': require('./lib/commands/version-create'),
      'zanata:push': require('./lib/commands/push'),
      'zanata:pull': require('./lib/commands/pull'),
    };
  }
};
