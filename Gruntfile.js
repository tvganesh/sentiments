var processManifest = require("./tasks/process-manifest.js");

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['*.js'],
      options: {
        node: "true"
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('process-manifest', processManifest);
  grunt.registerTask('default', ['jshint', 'process-manifest']);
};
