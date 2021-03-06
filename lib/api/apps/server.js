/* jshint node: true */

var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = function(snap) {

  /**
   * Apps API
   * @alias Snap#apps
   * @namespace
   */
  var apps = {

    /**
     * Get the manifest for the given app name
     * @param {string} appName
     * @param {Snap#apps.getAppManifestCallback} cb
     */
    getAppManifest: function(appName, cb) {

      var appsRoot = snap.config.get('apps:dir');
      var appManifestPath = path.join(appsRoot, appName, 'manifest.webapp');

      fs.readFile(appManifestPath, {encoding: 'utf8'}, function(err, content) {
        if(err) {
          // ENOENT: Manifest doesn't exist, ignore error & return null
          if(err.code === 'ENOENT') {
            return cb(null, null);
          } else {
            return cb(err);
          }
        }
        try {
          var manifest = JSON.parse(content);
          return cb(null, manifest);
        } catch(err) {
          return cb(err);
        }
      });
    },

    /**
     * @callback Snap#apps.getAppManifestCallback
     * @param {error} err
     * @param {object} manifest
     */

    /**
     * Get the list of all existings apps
     * @memberOf! Snap#apps
     * @param {Snap#apps.getAppsListCallback} cb
     */
    getAppsList: function(cb) {

      var appsRoot = snap.config.get('apps:dir');

      async.waterfall([
        function listFiles(next) {
          return fs.readdir(appsRoot, next);
        },
        function filterFolders(files, next) {
          var paths = files.map(function(f) {
            return path.join(appsRoot, f);
          });
          return async.map(paths, fs.stat, function(err, stats) {
            if(err) {
              return next(err);
            }
            var validFoldersOnly = files.filter(function(s, i) {
              // file is a directory & not hidden (ex: ignore .git)
              return stats[i].isDirectory() && s.indexOf('.') !== 0;
            });
            return next(null, validFoldersOnly);
          });
        }
      ], cb);

    }

    /**
     * @callback Snap#apps.getAppsListCallback
     * @param {error} err
     * @param {array} apps
     */

  };

  return apps;

};
