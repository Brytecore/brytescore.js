/*! Brytecore library */

( function( window, undefined ) {
	"use strict";

	// Assign the queue to var, so it can be safely overridden
	var items = brytescore.q;
	var function_name;
	var listeners = [];

	/*** Private methods ***/

	// Handle errors
	var return_error = function ( msg ) {
		console.log( "Brytescore error: " + msg );
	};

	/*** Brytescore definition ***/

	// Redefine the brytescore function to call track instead of
	// adding to array.
	window.brytescore = function() {
		var args = [].slice.call( arguments );

		// Ensure there is a function name passed
		if ( 0 == args.length ) {
			return_error( 'Invalid method name.' )
		}

		// Shift the function name off the array
		function_name = args.shift();

		var method = window['brytescore'][function_name];

		// Run function if it exists, passing the args
		// Otherwise, push it onto the queue
		if ( 'function' === typeof method ) {
			method( args );
		} else {
			brytescore.q.push( arguments );
		}
	};

	// Re-add the queue
	window.brytescore.q = [];

	/***** Event Emitter ****/

	window.brytescore.on = function( event, callback ) {
		listeners.push( event, callback );
	};

	window.brytescore.emit = function( event, args ) {

	};

	// Remove a single listener from an event
	window.brytescore.removeListener = function( event, callback ) {
		var all_listeners = listeners;
		for ( var i = 0; i < all_listeners.length; i++ ) {
			if ( event === all_listeners[i][0] && callback === all_listeners[i][1] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	// Remove all listeners from a single event
	window.brytescore.removeAllListeners = function( event ) {
		var all_listeners = listeners;
		for ( var i = 0; i < all_listeners.length; i++ ) {
			if ( event === all_listeners[i][0] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	// Main track function
	window.brytescore.track = function () {
		var args = [].slice.call( arguments );
		args = args[0];

		// Ensure there is a function name passed
		if ( 0 === args.length ) {
			return_error( 'Invalid method name.' )
		}

		// Shift the function name off the array
		var event_name = args.shift();

		console.log( 'Tracking event "' + event_name + '" with data:' );
		console.log( args );
	};

	// Retrieve a package
	window.brytescore.load = function( package_name, callback ) {

	};

	// Check to see if a package is loaded
	window.brytescore.is_loaded = function( package_name ) {
		console.log( 'is_loaded function called for package ' + package_name );
	};

	/*** Queue processing ***/

	// Get any current data out of the queue,
	// sending it to new brytescore function
	for ( var i = 0; i < items.length; i++ ) {
		console.log(items[i]);
		brytescore.apply( document, items[i] );
	}

}( window ) );

( function ( window, undefined ) {
	window.brytescore['eddie'] = function() {
		console.log('eddie');
	}
})(window);
