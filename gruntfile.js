module.exports = function( grunt ) {
	require( "matchdep" ).filterDev( "grunt-*" ).forEach( grunt.loadNpmTasks );

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		concat: {
			pwn_js: {
				options: {
					banner:
						"/*! Brytescore JavaScript library v<%= pkg.version %>\n" +
						" *  Copyright 2015 Brytecore, LLC\n" +
						" */\n"
				},
				src: [
					"lib/**/*.js"
				], dest: "dist/js/brytescore.js"
			}
		},
		uglify: {
			options: {
				preserveComments: "some"
			}, build: {
				files: {
					"dist/js/brytescore.min.js": ["dist/js/brytescore.js"]
				}
			}
		},
		watch: {
			js: {
				files: ["lib/**/*.js"],
				tasks: ["build"]
			}
		}
	});

	grunt.registerTask( "default", [] );
	grunt.registerTask( "build", ["concat", "uglify"] );
};