/*! Brytecore library */

( function( window, undefined ) {
	"use strict";

	// Assign the queue to var, so it can be safely overridden
	var items = brytescore.q,
		function_name,
		listeners = [];

	/*** Private methods ***/

	// Handle errors
	var return_error = function ( msg ) {
		console.log( "Brytescore error: " + msg );
	};

	/*** Brytescore definition ***/

	// Redefine the brytescore function to call track instead of
	// adding to array.
	window.brytescore = function() {
		var args = [].slice.call( arguments ),
			method;

		// Ensure there is a function name passed
		if ( 0 === args.length ) {
			return_error( 'Invalid method name.' );
		}

		// Shift the function name off the array
		function_name = args.shift();

		method = window['brytescore'][function_name];

		// Run function if it exists, passing the args
		// Otherwise, push it onto the queue
		if ( 'function' === typeof method ) {
			method( args );
		} else {
			brytescore.q.push( arguments );
		}

	};
	console.log( 'new brytescore object ready.' );
	console.log( elapsed() );

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
			return_error( 'Invalid method name.' );
		}

		// Shift the function name off the array
		var event_name = args.shift();

		console.log( 'Tracking event "' + event_name + '" with data:' );
		console.log( args );
		console.log( elapsed() );
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

	console.log( 'Brytescore queue processed.' );
	console.log( elapsed() );

}( window ) );

( function ( window, undefined ) {
	'use strict';

	window.brytescore['eddie'] = function() {
		console.log('eddie');
	};
})(window);

/*
1. check for life session cookie
  - if no cookie, create with:
    user_id - null if unauthenticated
    anon_id - uuid
  - if cookie, refresh end date
2. check for session cookie
  - if no cookie, create with:
    session_id - uuid
    begin_date
    anon_id
    browser_string
3. Log pageview
    page_view_id - uuid
    host name
    campaign
    campaign medium
    campaign source
    session_id
4. Heartbeat
    page_view_id
    every X seconds


Other:

brytescore.identify()
    user_id
    name
    email

brytescore.setAPIKey

brytescore.alias()


Packages:

brytescore.load( package )

brytescore.isLoaded( package )



 */
