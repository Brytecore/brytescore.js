'use strict';

module.exports = function( grunt ) {
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-replace' );


	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		concat: {
			pwn_js: {
				options: {
					preserveComments: /^!/,
					banner:
						'/*! Brytescore JavaScript library v<%= pkg.version %>\n' +
						' *  Copyright 2015-2022 Brytecore, Inc\n' +
						' */\n',
				},
				src: [
					//'lib/**/*.js',
					'lib/brytescore.js',
					'lib/chatbot.js',
				],
				dest: 'dist/js/brytescore.js',
			},
		},
		replace: {
			dist: {
				options: {
					patterns: [
						{
							match: 'libraryVersion',
							replacement: '<%= pkg.version %>',
						},
					],
				},
				files: [
					{
						expand: true,
						flatten: true,
						src: [ 'dist/js/brytescore.js' ],
						dest: 'dist/js/',
					},
				],
			},
		},
		uglify: {
			options: {
				preserveComments: /^!/,
			},
			build: {
				files: {
					'dist/js/brytescore.min.js': [ 'dist/js/brytescore.js' ],
					'examples/js/snippet.min.js': [ 'examples/js/snippet.js' ],
				},
			},
		},
		watch: {
			js: {
				files: [ 'lib/**/*.js' ],
				tasks: [ 'build' ],
			},
		},
	} );

	grunt.registerTask( 'default', [] );
	grunt.registerTask( 'build', [ 'concat', 'replace', 'uglify' ] );
};
