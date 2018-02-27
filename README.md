ember-cli-zanata
==============================================================================

An addon to work with the [Zanata](http://zanata.org/) API.

This is built to work together with [ember-l10n](https://github.com/Cropster/ember-l10n).

Installation
------------------------------------------------------------------------------

```
ember install ember-cli-zanata
```

Enter your API data in the generated `config/zanata.js` file.


Usage
------------------------------------------------------------------------------

This addons provides a few commands to use:

* `ember zanata:push`: Push your updated to Zanata
* `ember zanata:pull`: Pull a given version from Zanata
* `ember zanata:version-create`: Create a new version for a project
* `ember zanata:version-info`: List information for a given version of a project
* `ember zanata:version-stats`: List translation stats for a given version of a project
* `ember zanata:project-info`: List basic information (like latest version) for a project
* `ember zanata:project-list`: List all projects from Zanata

For all of these commands, you can run `help` to see all available parameters, e.g. `ember help zanata:push`.

## Commands

### push

Pull translation data from Zanata.
This can pull translation files, source files, or both.
Don't forget to specify a version & project to pull from!

You'll also need to specify the list of locales to pull.
It is recommended to put those (along with the project-id) in the `config/zanata.js` file.

* Push all files: `ember zanata:push`
* Push translation files only: `ember zanata:push --update-type=trans`
* Push source files only: `ember zanata:push --update-type=source`

Note that the Zanata API is a bit flaky. Because of this, this will try to push a few times - by default, 4 times.
Only if it fails 4 times, will it error out.
 
### pull

Pull translation data from Zanata.
This can pull translation files, source files, or both.
Don't forget to specify a version & project to pull from!

You'll also need to specify the list of locales to pull.
It is recommended to put those (along with the project-id) in the `config/zanata.js` file.

* Pull translation files only: `ember zanata:pull`
* Pull all files: `ember zanata:pull --update-type=both`
* Pull source files only: `ember zanata:pull --update-type=source`

### version-create

Create a new version for a project.

`ember zanata:version-create --version="XXX"`

By default, it will push all files (sources & translations!) after successfully creating a new version.
You can deactivate that behaviour like this:

`ember zanata:version-create --version="XXX" --update-if-new=false`

Additionally, if the version you are trying to create already exists, it will throw an error.
You can supress that with:

`ember zanata:version-create --version="XXX" -resolve-if-exists=true`

This will then just print out a message that the version already exists, but exit with a success code.

### version-stats

Show translation stats for a version of a project.

`ember zanata:version-stats --version="XXX"`

Will print something like this:

```sh
Translation progress for version 1.0.10 of project my-project (document messages): 81.65%
en: 100.00% (1064/1064) of phrases translated
zh-Hans: 98.03% (1043/1064) of phrases translated
zh-Hant: 98.03% (1043/1064) of phrases translated
de: 30.55% (325/1064) of phrases translated
```

### version-info

Show information for a version of a project.

This is mainly the available locales.

`ember zanata:version-info --version="XXX"`

Will print something like this:

```sh
Version 1.0.10 for project my-project was successfully loaded
It has the following locales:
en: English
zh-Hans: Chinese (Simplified)
zh-Hant: Chinese (Traditional)
de: German
```

### project-info

Display information for a given project.

`ember zanata:project-info --project-id="XXX"`

Will output something like:

```sh
Project my-project was successfully loaded
Project name: My Project
Latest version: 1.0.10
```

### project-list

Display a list of all active projects available.

`ember zanata:project-list`

Will output something like:

```sh
2 active projects were found:
My Project (my-project)
Other Project (other-project)
```

Handling versions
------------------------------------------------------------------------------

Instead of specifying an actual version, you can also provide `current`, which will use the version from the `package.json` file.

Handling special locales
------------------------------------------------------------------------------

Sometimes, you might have locales that are called differently on Zanata than in your app.
For example, in Zanata you might have `zh-Hans`, whereas it might be called `zh_CN` in your app.

For this, you can provide a special function in your Zanata config:

```js
// config/zanata.js
module.exports = function() {
  return {
    // other config
    getZanataLocaleFunction(locale) {
      // From your app to Zanata, e.g. zh_CN --> zh-Hans
      return locale;
    },
    parseZanataLocaleFunction(locale) {
      // From Zanata to your app, e.g. zh-Hans --> zh_CN
      return locale;
    }
  };
};
```

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
