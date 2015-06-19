/*! Brytescore JavaScript library v0.2.0
 *  Copyright 2015 Brytecore, LLC
 */
/* Brytecore library */

( function ( window, undefined ) {
	'use strict';

	/*** Compatibility checks ***/

	/**
	 * Array.indexOf()
	 */
	if ( !Array.prototype.indexOf ) {
		Array.prototype.indexOf = function ( find, i /*opt*/ ) {
			if ( undefined === i ) {
				i = 0;
			} else if ( 0 > i ) {
				i += this.length;
				if ( 0 > i ) {
					i = 0;
				}
			}

			for ( var n = this.length; i < n; i++ ) {
				if ( i in this && this[i] === find ) {
					return i;
				}
			}
			return -1;
		};
	}

	/*** Private Variables ***/

	var items = brytescore.q,				// Assign the queue to var, so it can be safely overridden
		functionName,						// The function run by the client
		listeners = [],						// Registered event listeners
		xhr,								// XML HTTP Request object
		url = 'https://api.brytescore.com',	// Path to the API
	//url = 'http://localhost:8080',
		i,									// Counter
		oneYear = 31536000000,				// One year, in milliseconds
		APIKey,                             // Brytescore API Key
		anonymousId,						// Brytescore uuid
		userId,								// Client user id
		sessionId,							// Brytescore session id
		pageViewId,							// Brytescore page view id
		heartBeatEventName = 'heartBeat',
		pageViewEventName = 'pageView',
		heartBeatInterval = 15000,
		totalPageViewTime = 0,
		heartbeatID,                        // the id of the heartbeat timer in case it needs to be stopped
		inactivityID = 0,                   // the id of the inactivity timer.
		inactivityLogoutID,                 // the id for the timer that will close session and all that.
		eventListenerHandle,                //  the handle for the event listeners
		oldHref = '',
		sessionTimeout = false;             // boolean for whether the session is timed out or not.


	/*** Private methods ***/

	/**
	 * Handle an error.
	 *
	 * @param msg
	 */
	var returnError = function ( msg ) {
		console.log( 'Brytescore error: ' + msg );
	};

	/**
	 * Get the data for a specific cookie.
	 *
	 * @param cname
	 * @returns {*}
	 */
	var readCookie = function ( cname ) {
		var name = cname + '=';
		var ca = document.cookie.split( ';' );
		for ( var i = 0; i < ca.length; i++ ) {
			var c = ca[i];
			while ( ' ' === c.charAt(0) ) {
				c = c.substring(1);
			}
			if ( c.indexOf( name ) !== -1 ) {
				return c.substring( name.length, c.length );
			}
		}
		return null;
	};

	/**
	 * Write a cookie for this domain.
	 *
	 * @param name
	 * @param data
	 * @param expiry
	 */
	var writeCookie = function ( name, data, expiry ) {
//		var domain = window.location.hostname;

//		if ( 'localhost' == domain.substring( domain.lastIndexOf( '.' ) ) ) {
//			domain = '';
//		} else {
//			domain = '; domain=.' + domain.substring( domain.lastIndexOf( '.', domain.lastIndexOf( '.' ) - 1 ) + 1 );
//		}

		name = encodeURIComponent( name );
		data = encodeURIComponent( data );

		if ( null !== expiry ) {
			document.cookie = name + '=' + data + '; expires=' + expiry + '; path=/';
		} else {
			document.cookie = name + '=' + data + '; path=/';
		}

	};

	/*** Brytescore definition ***/

	/**
	 * Redefine the brytescore function to call public methods instead of
	 * adding to .q array.
	 */
	window.brytescore = function () {
		//Check to see if the url has changed via ajax if so kill old pageview and start a new one
		if ( '' === oldHref ) {
			oldHref = location.href;
		}
		var newHref = location.href;
		if ( newHref !== oldHref ) {
			window.brytescore.killHeartbeat();
			window.brytescore.pageview( {} );
			oldHref = newHref;
		}
		var args = [].slice.call( arguments ),
			method;

		//console.log(args);
		// Ensure there is a function name passed
		if ( 0 === args.length ) {
			returnError( 'Invalid method name.' );
		}

		// Shift the function name off the array
		functionName = args.shift();
		//console.log( functionName );
		//Package functionNames will show as namespace.functionName
		if ( 0 < functionName.indexOf('.') ) {
			var arr = functionName.split('.');
			var namespace = arr[0];
			var prop = arr[1];
			//check if the namesapce is an object if it is not the package has not been loaded yet
			method = ( 'object' === typeof window.brytescore[namespace] )
				? window.brytescore[namespace][prop]
				: null;
		} else {
			//brytescore core function
			method = window.brytescore[functionName];
		}

		// Run function if it exists, passing the args
		// Otherwise, push it onto the queue
		if ( 'function' === typeof method ) {
			method.apply( window, args );
		} else {
			brytescore.q.push( [].slice.call( arguments ) );
		}


//        if( brytescore.q.length > 0 ) {
//            setTimeout( brytescore.processBrytescoreQueue, 1 );
//        }
//        // if document already ready to go, schedule the ready function to run
//        if ( document.readyState === "complete" ) {
//            setTimeout( brytescore.processBrytescoreQueue, 1 );
//        } else if ( !readyEventHandlersInstalled ) {
//            // otherwise if we don't have event handlers installed, install them
//            if ( document.addEventListener ) {
//                // first choice is DOMContentLoaded event
//                document.addEventListener( "DOMContentLoaded", brytescore.processBrytescoreQueue, false );
//                // backup is window load event
//                window.addEventListener( "load", brytescore.processBrytescoreQueue, false );
//            } else {
//                // must be IE
//                document.attachEvent( "onreadystatechange", readyStateChange );
//                window.attachEvent( "onload", brytescore.processBrytescoreQueue );
//            }
//            readyEventHandlersInstalled = true;
//        }

	};

	// Re-add the queue
	window.brytescore.q = [];

	/***** Event Emitter ****/

	window.brytescore.on = function ( event, callback ) {
		listeners.push( event, callback );
	};

	window.brytescore.emit = function ( event, args ) {

	};

	// Remove a single listener from an event
	window.brytescore.removeListener = function ( event, callback ) {
		var all_listeners = listeners;
		for ( var i = 0; i < all_listeners.length; i++ ) {
			if ( event === all_listeners[i][0] && callback === all_listeners[i][1] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	// Remove all listeners from a single event
	window.brytescore.removeAllListeners = function ( event ) {
		var all_listeners = listeners;
		for ( var i = 0; i < all_listeners.length; i++ ) {
			if ( event === all_listeners[i][0] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	//Authentication function
	window.brytescore.authenticate = function ( userID, data ) {
		// Check persistent cookie
		var bc = readCookie( 'brytescore_uu' ),
			values,
			cookieData,
			date;

		userId = userID;
		if ( null !== bc ) {
			values = JSON.parse( decodeURIComponent( bc ) );
			anonymousId = values.aid;
		} else {
			anonymousId = brytescore.generateUUID();
		}

		cookieData = JSON.stringify( {
			'aid': anonymousId,
			'uid': userID
		} );

		date = new Date();
		date.setTime( date.getTime() + oneYear );

		writeCookie( 'brytescore_uu', cookieData, date.toUTCString() );

		brytescore.track( 'authenticate', data );
	};

	window.brytescore.submittedForm = function ( data ) {
		brytescore.track( 'submittedForm', data );
	};

	//Update any user information
	window.brytescore.updateUserInfo = function ( userID, data ) {
		if ( undefined === userId || userID !== userId ) {
			var bc = readCookie( 'brytescore_uu' ),
				values,
				cookieData,
				date;

			userId = userID;
			if ( null !== bc ) {
				values = JSON.parse( decodeURIComponent( bc ) );
				anonymousId = values.aid;
			} else {
				anonymousId = brytescore.generateUUID();
			}

			cookieData = JSON.stringify( {
				'aid': anonymousId,
				'uid': userID
			} );

			date = new Date();
			date.setTime( date.getTime() + oneYear );

			writeCookie( 'brytescore_uu', cookieData, date.toUTCString() );
		}
		brytescore.track( 'updateUserInfo', data );
	};


	window.brytescore.registerAccount = function ( userID, data ) {
		if ( undefined === userId || userID !== userId ) {
			var bc = readCookie( 'brytescore_uu' ),
				values,
				cookieData,
				date;

			userId = userID;
			if ( null !== bc ) {
				values = JSON.parse( decodeURIComponent( bc ) );
				anonymousId = values.aid;
			} else {
				anonymousId = brytescore.generateUUID();
			}

			cookieData = JSON.stringify( {
				'aid': anonymousId,
				'uid': userID
			} );

			date = new Date();
			date.setTime( date.getTime() + oneYear );

			writeCookie( 'brytescore_uu', cookieData, date.toUTCString() );
		}
		brytescore.track( 'registerAccount', data );
	};


	// Set API Key function
	window.brytescore.setAPIKey = function ( apiKey ) {
		//console.log("api Key set: " + apiKey );
		APIKey = apiKey;
	};

	// start a pageView
	window.brytescore.pageview = function ( data ) {
		totalPageViewTime = 0;
		var newURL = window.location.protocol + '//' + window.location.host + '/' + window.location.pathname;
		pageViewId = brytescore.generateUUID();
		data.pageUrl = newURL;
		data.pageTitle = document.title;
		data.referrer = document.referrer;
		brytescore.track( pageViewEventName, data );

		//update session cookie with new expiration date because of FF and Chrome issue on mac where they don't expire session cookies
		var browserString = navigator.userAgent;
		data = JSON.stringify( {
			'sid': sessionId,
			'brw': browserString,
			'aid': anonymousId
		} );

		var date = new Date();
		date.setTime( date.getTime() + 1800000 );  //30 minutes
		writeCookie( 'brytescore_session', data, date.toUTCString() );


		//send the first heartbeat and start the timer
		brytescore.heartBeat();
		heartbeatID = window.setInterval( function () {
			brytescore.heartBeat();
		}, heartBeatInterval );
	};

	window.brytescore.killHeartbeat = function () {
		clearInterval( heartbeatID );
	};


	// Main track function
	window.brytescore.track = function ( eventName, data ) {
		sendRequest( 'track', eventName, data );
	};

	window.brytescore.heartBeat = function () {
		window.brytescore.track( heartBeatEventName, { elapsedTime: totalPageViewTime} );
		totalPageViewTime = totalPageViewTime + ( heartBeatInterval / 1000 );
	};

	/**
	 * Function to load json packages.
	 *
	 * @param url
	 */
	window.brytescore.load = function ( url ) {
		//var realestate = '{"name":"Brytecore Real Estate","namespace":"realestate","author":"Brytecore <info@brytecore.com>","version":"0.0.1","description":"Real estate visitor behavior and listing searches.","url":"","globals":{"listing":{"required":{"price":"number","mls_id":"string"},"optional":{"street_address":"string","street_address_2":"string","city":"string","state_province":"string","postal_code":"string","latitude":"string","longitude":"string"}}},"events":{"viewed_listing":{"display_name":"Viewed a listing","globals":["listing"]},"printed_driving_directions":{"display_name":"Printed driving directions","globals":["listing"]},"requested_showing":{"display_name":"Requested a showing","globals":["listing"]},"listing_impression":{"display_name":"Saw listing in search results","required":{"price":"number","mls_id":"string"},"optional":{"street_address":"string","street_address_2":"string","city":"string","state_province":"string","postal_code":"string","latitude":"string","longitude":"string"}}},"aggregates":{"average_listing_price":{"type":"average","aggregate_key":"mls_id","event":"viewed_listing","data_key":"price","scopes":["site","user","api_key"]},"listing_impressions":{"type":"count","event":"listing_impression","unique_key":"mls_id","scopes":["site","user","api_key"]},"median_listing_price":{"type":"median","aggregate_key":"mls_id","event":"viewed_listing","data_key":"price","scopes":["site","user","api_key"]}},"indicators":{"lookie-lou":{"type":"event","display_name":"Lookie-lou","event":{"name":"viewed_listing"},"weight":20},"driver":{"type":"repetition","display_name":"This guy likes to drive","events":[{"name": "printed_driving_directions","repititions": 5},{"name": "requested_showing","repetitions": 1}],"timeframe":"3d","weight":40},"go-getter":{"type":"sequence","display_name":"Im on the way!","events":[{"name": "viewed_listing","parameters": {"price": ["gte","400000"]}},{"name": "requested_showing"},{"name": "printed_driving_directions"}],"timeframe":"1d","weight":60}},"dependencies":{}}';
		//var json = JSON.parse( realestate );

		//AJAX request for the package
		var AJAX_req = createCORSRequest( 'GET', url );

		AJAX_req.onreadystatechange = function () {
			if ( 4 === AJAX_req.readyState && 200 === AJAX_req.status ) {

				var json = JSON.parse( AJAX_req.responseText );
				//get just the events object of the package
				var jsonEvents = json.events;
				//get the namespace of the package
				var namespace = json.namespace;
				// get an object of global scoped objects for required and optional parameters for the function
				var jsonGlobals = json.globals;
				//setup the namespace object so we can add functions to it
				window.brytescore[namespace] = {};
				//loop through each Event in the object and create a function for each event.
				//window.brytescore.factory is a closure so that prop and namespace can be passed in and keep its value at the time of passing it in
				for ( var prop in jsonEvents ) {
					console.log( prop.displayName );
					window.brytescore.factory = function ( eventName, packageNamespace ) {
						return function () {
							return window.brytescore.track( packageNamespace + '.' + eventName, arguments[0] );
						};
					};
					window.brytescore[namespace][prop] = window.brytescore.factory( prop, namespace );

					//loop through the queue and process the items for this function and remove them from the queue
					for ( var i = 0; i < window.brytescore.q.length; i++ ) {
						if ( namespace + '.' + prop === window.brytescore.q[i][0] ) {
							window.brytescore[namespace][prop]( window.brytescore.q[i][1] );
							//window.brytescore.q.splice( i, 1 );
						}
					}
				}
			}
		};
		AJAX_req.send();
		window.brytescore.q = [];
	};

//    window.brytescore.processBrytescoreQueue = function() {
//        //loop through the queue and process the items for this function and remove them from the queue
//            for ( var i = 0; i < window.brytescore.q.length; i++ ) {
//                if(i=49){
//                    alert( 'function' === typeof window['brytescore'][window.brytescore.q[i][0]] );
//                    alert(i);
//                }
//                if ( 'function' === typeof window['brytescore'][window.brytescore.q[i][0]] ) {
//                    window['brytescore'][window.brytescore.q[i][0]]( window.brytescore.q[i][1] );
//                    window.brytescore.q.splice( i, 1 );
//                }
//            }
//    };

	//XMLHttpRequest functions
	/**
	 * Wrapper Function for making CORS call to the API
	 *
	 * @param {string} path
	 * @param {string} eventName
	 * @param {{}} data
	 */
	function sendRequest( path, eventName, data ) {
		xhr = createCORSRequest( 'Post', url + '/' + path );

		if ( null !== xhr ) {
			var eventData = {
				'event': eventName,
				'hostName': location.hostname,
				'apiKey': APIKey,
				'anonymousId': anonymousId,
				'userId': userId,
				'pageViewId': pageViewId,
				'sessionId': sessionId,
				'data': data || {}
			};

			xhr.onload = serverResponse;
			xhr.onerror = function ( err ) {
				// TODO: Do something on error?
				console.log( 'Error with request' );
				console.log( err );
				console.log( xhr.response );
			};

			//console.log( JSON.stringify( eventData ) );
			xhr.send( JSON.stringify( eventData ) );
		}
	}

	function createCORSRequest( method, url ) {
		var xhr = new XMLHttpRequest();
		if ( 'withCredentials' in xhr ) {
			// XHR for Chrome/Firefox/Opera/Safari.
			xhr.open( method, url, true );
		} else if ( 'undefined' !== typeof XDomainRequest ) {
			// XDomainRequest for IE.
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			// CORS not supported.
			xhr = null;
		}
		xhr.setRequestHeader( 'Content-Type', 'application/json' );
		return xhr;
	}


	/**
	 * The callback function that is called when the XMLHttpRequest is finished
	 */
	function serverResponse() {
		var response = xhr.responseText;
		if ( response && '' !== response ) {

			response = JSON.parse( response ); // TODO: Add backwards support for IE7- (json-sans-eval?)

			if ( response && response.hasOwnProperty( 'code' ) ) {
				switch ( response.code.toLowerCase() ) {
					case 'success':
						// Don't do anything we were successful
						break;
					case 'unauthorizederror':
						// TODO: Fire event
						break;
					case 'badrequesterror':
						console.error( 'The request was not properly formatted.' );
						break;
					default:
						//console.log( response );
						// TODO: Something here?
						break;
				}
			}
		}
	}

	function killSession() {
		brytescore.killHeartbeat();
		//delete session cookie
		writeCookie( 'brytescore_session', null, new Date( 1974, 9, 18 ) );
		//clear session variables
		sessionId = undefined;
		sessionTimeout = true;
		//reset pageviewIDs
		pageViewId = undefined;
	}

	var startInactivityTimer = function () {
		if ( 0 === inactivityID ) {
			if ( undefined !== eventListenerHandle ) {
				removeEventListeners();
			}

			//check for killed session cookie
			if ( true === sessionTimeout ) {
				window.brytescore.updateCookies();
				window.brytescore.pageview({});
			}
			//clears the timer if set
			clearInterval( inactivityID );
			clearTimeout( inactivityLogoutID );

			//start a timer that will check every 5 minutes for activity.
			//at the end of 5 minutes event listeners will be added to the dom.
			inactivityID = window.setInterval(function () {
				addEventListeners();
			}, 300000);
		}
	};

	function removeEventListeners() {
		if ( eventListenerHandle.removeListener ) {
			eventListenerHandle.removeListener( 'mousemove', startInactivityTimer );
			eventListenerHandle.removeListener( 'click', startInactivityTimer );
			eventListenerHandle.removeListener( 'keyup', startInactivityTimer );
			eventListenerHandle.removeListener( 'scroll', startInactivityTimer );
		} else if ( eventListenerHandle.detachEvent ) {
			eventListenerHandle.detachEvent( 'onmousemove', startInactivityTimer );
			eventListenerHandle.detachEvent( 'onkeyup', startInactivityTimer );
			eventListenerHandle.detachEvent( 'onclick', startInactivityTimer );
			eventListenerHandle.detachEvent( 'onscroll', startInactivityTimer );
		}
		eventListenerHandle = undefined;
	}

	function addEventListeners() {
		//clears the timer if set
		clearInterval( inactivityID );
		inactivityID = 0;
		//start a timer that will fire in 25 minutes if no activity.
		inactivityLogoutID = setTimeout( function () {
			killSession();
		}, 1500000 );

		//var lastMove = 0;
		eventListenerHandle = window;
		if ( eventListenerHandle.addEventListener ) {                    // For all major browsers, except IE 8 and earlier
			eventListenerHandle.addEventListener( 'mousemove', startInactivityTimer );
			eventListenerHandle.addEventListener( 'click', startInactivityTimer );
			eventListenerHandle.addEventListener( 'scroll', startInactivityTimer );
			eventListenerHandle.addEventListener( 'keyup', startInactivityTimer );
		} else if ( eventListenerHandle.attachEvent ) {                  // For IE 8 and earlier versions
			eventListenerHandle.attachEvent( 'onmousemove', startInactivityTimer );
			eventListenerHandle.attachEvent( 'onclick', startInactivityTimer );
			eventListenerHandle.attachEvent( 'onscroll', startInactivityTimer );
			eventListenerHandle.attachEvent( 'onkeyup', startInactivityTimer );
		}
	}

	/**
	 * Fast UUID generator, RFC4122 version 4 compliant.
	 * @author Jeff Ward (jcward.com).
	 * @license MIT license
	 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
	 **/
	var lut = [];
	for ( i = 0; 256 > i; i++ ) {
		lut[i] = ( (16 > i) ? '0' : '' ) + (i).toString(16);
	}
	window.brytescore.generateUUID = function () {
		var d0 = Math.random() * 0xffffffff | 0;
		var d1 = Math.random() * 0xffffffff | 0;
		var d2 = Math.random() * 0xffffffff | 0;
		var d3 = Math.random() * 0xffffffff | 0;
		return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
			lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
			lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
			lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
	};

	/**
	 * Update the Brytescore and session cookies
	 */
	window.brytescore.updateCookies = function () {
		// Check persistent cookie
		var bc = readCookie( 'brytescore_uu' ),
			sc = readCookie( 'brytescore_session' ),
			values,
			data,
			date,
			browserString;

		//console.log( readCookie( 'brytescore_uu' ) );
		if ( null !== bc ) {
			values = JSON.parse( decodeURIComponent( bc ) );
			anonymousId = values.aid;
			userId = values.uid;
		} else {
			anonymousId = brytescore.generateUUID();
			userId = '';
		}

		data = JSON.stringify( {
			'aid': anonymousId,
			'uid': userId
		} );

		date = new Date();
		date.setTime( date.getTime() + oneYear );
		writeCookie( 'brytescore_uu', data, date.toUTCString() );

		// Check session cookie
		if ( null !== sc && true !== sessionTimeout ) {
			values = JSON.parse( decodeURIComponent( sc ) );
			sessionId = values.sid;
		} else {
			sessionId = brytescore.generateUUID();
			browserString = navigator.userAgent;

			data = JSON.stringify( {
				'sid': sessionId,
				'brw': browserString,
				'aid': anonymousId
			} );

			date = new Date();
			date.setTime( date.getTime() + 1800000 );  //30 minutes
			writeCookie( 'brytescore_session', data, date.toUTCString() );

			//waiting to send created event until session data is created.
			//only send event if cookie was created for first time.
			if ( null === bc ) {
				brytescore.track( 'brytescore_uuid_created', { 'anonymous_id': anonymousId } );
			}
			//only send event if cookie was created for first time.
			if ( null === sc || true === sessionTimeout ) {
				sessionTimeout = false;
				brytescore.track( 'session_start', { 'session_id': sessionId, 'browser_string': browserString, 'anonymous_id': anonymousId } );
			}
		}

	};

	/**
	 * Retrieve a package from the API.
	 *
	 * @param package_name
	 * @param callback
	 */
//	window.brytescore.load = function( package_name, callback ) {
//
//	};

	/**
	 * Check to see if a certain package has loaded.
	 *
	 * @param package_name
	 */
	window.brytescore.is_loaded = function ( package_name ) {
		console.log( 'is_loaded function called for package ' + package_name );
	};

	/**
	 * Process the internally queued actions that were present before initial object creation.
	 */
	window.brytescore.processQueue = function () {
		/*** Queue processing ***/

		// Get any current data out of the queue,
		// sending it to new brytescore function
		for ( i = 0; i < items.length; i++ ) {
			//console.log( items[i] );
			brytescore.apply( document, items[i] );
		}
	};


	/**
	 * Initialize the object.
	 */
	window.brytescore.init = function () {
		var indefined;
		//loop through the queue and process the setAPIKey and remove it from the queue
		if ( indefined === APIKey ) {
			for ( i = 0; i < items.length; i++ ) {
				if ( 'setapikey' === items[i][0].toLowerCase() ) {
					//brytescore.apply( document, items[i] );
					brytescore.setAPIKey( items[i][1] );
					items.splice( i, 1 );
				}
			}
		}
		brytescore.updateCookies();
		brytescore.processQueue();
		startInactivityTimer();
	};

	brytescore.init();

}( window ) );

(function ( window, undefined ) {
	'use strict';

	window.brytescore.eddie = function () {
		console.log( 'eddie' );
	};
})( window );

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

/*
 json2.js
 2014-02-04

 Public Domain.

 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

 See http://www.JSON.org/js.html


 This code should be minified before deployment.
 See http://javascript.crockford.com/jsmin.html

 USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 NOT CONTROL.


 This file creates a global JSON object containing two methods: stringify
 and parse.

 JSON.stringify(value, replacer, space)
 value       any JavaScript value, usually an object or array.

 replacer    an optional parameter that determines how object
 values are stringified for objects. It can be a
 function or an array of strings.

 space       an optional parameter that specifies the indentation
 of nested structures. If it is omitted, the text will
 be packed without extra whitespace. If it is a number,
 it will specify the number of spaces to indent at each
 level. If it is a string (such as '\t' or '&nbsp;'),
 it contains the characters used to indent at each level.

 This method produces a JSON text from a JavaScript value.

 When an object value is found, if the object contains a toJSON
 method, its toJSON method will be called and the result will be
 stringified. A toJSON method does not serialize: it returns the
 value represented by the name/value pair that should be serialized,
 or undefined if nothing should be serialized. The toJSON method
 will be passed the key associated with the value, and this will be
 bound to the value

 For example, this would serialize Dates as ISO strings.

 Date.prototype.toJSON = function (key) {
 function f(n) {
 // Format integers to have at least two digits.
 return n < 10 ? '0' + n : n;
 }

 return this.getUTCFullYear()   + '-' +
 f(this.getUTCMonth() + 1) + '-' +
 f(this.getUTCDate())      + 'T' +
 f(this.getUTCHours())     + ':' +
 f(this.getUTCMinutes())   + ':' +
 f(this.getUTCSeconds())   + 'Z';
 };

 You can provide an optional replacer method. It will be passed the
 key and value of each member, with this bound to the containing
 object. The value that is returned from your method will be
 serialized. If your method returns undefined, then the member will
 be excluded from the serialization.

 If the replacer parameter is an array of strings, then it will be
 used to select the members to be serialized. It filters the results
 such that only members with keys listed in the replacer array are
 stringified.

 Values that do not have JSON representations, such as undefined or
 functions, will not be serialized. Such values in objects will be
 dropped; in arrays they will be replaced with null. You can use
 a replacer function to replace those with JSON values.
 JSON.stringify(undefined) returns undefined.

 The optional space parameter produces a stringification of the
 value that is filled with line breaks and indentation to make it
 easier to read.

 If the space parameter is a non-empty string, then that string will
 be used for indentation. If the space parameter is a number, then
 the indentation will be that many spaces.

 Example:

 text = JSON.stringify(['e', {pluribus: 'unum'}]);
 // text is '["e",{"pluribus":"unum"}]'


 text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

 text = JSON.stringify([new Date()], function (key, value) {
 return this[key] instanceof Date ?
 'Date(' + this[key] + ')' : value;
 });
 // text is '["Date(---current time---)"]'


 JSON.parse(text, reviver)
 This method parses a JSON text to produce an object or array.
 It can throw a SyntaxError exception.

 The optional reviver parameter is a function that can filter and
 transform the results. It receives each of the keys and values,
 and its return value is used instead of the original value.
 If it returns what it received, then the structure is not modified.
 If it returns undefined then the member is deleted.

 Example:

 // Parse the text. Values that look like ISO date strings will
 // be converted to Date objects.

 myData = JSON.parse(text, function (key, value) {
 var a;
 if (typeof value === 'string') {
 a =
 /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 if (a) {
 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 +a[5], +a[6]));
 }
 }
 return value;
 });

 myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 var d;
 if (typeof value === 'string' &&
 value.slice(0, 5) === 'Date(' &&
 value.slice(-1) === ')') {
 d = new Date(value.slice(5, -1));
 if (d) {
 return d;
 }
 }
 return value;
 });


 This is a reference implementation. You are free to copy, modify, or
 redistribute.
 */

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
 call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
 getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
 lastIndex, length, parse, prototype, push, replace, slice, stringify,
 test, toJSON, toString, valueOf
 */


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if ( typeof JSON !== 'object' ) {
    JSON = {};
}

(function () {
    'use strict';

    function f( n ) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if ( typeof Date.prototype.toJSON !== 'function' ) {

        Date.prototype.toJSON = function () {

            return isFinite( this.valueOf() )
                ? this.getUTCFullYear() + '-' +
                f( this.getUTCMonth() + 1 ) + '-' +
                f( this.getUTCDate() ) + 'T' +
                f( this.getUTCHours() ) + ':' +
                f( this.getUTCMinutes() ) + ':' +
                f( this.getUTCSeconds() ) + 'Z'
                : null;
        };

        String.prototype.toJSON =
            Number.prototype.toJSON =
                Boolean.prototype.toJSON = function () {
                    return this.valueOf();
                };
    }

    var cx,
        escapable,
        gap,
        indent,
        meta,
        rep;


    function quote( string ) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test( string ) ? '"' + string.replace( escapable, function ( a ) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
        } ) + '"' : '"' + string + '"';
    }


    function str( key, holder ) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if ( value && typeof value === 'object' &&
            typeof value.toJSON === 'function' ) {
            value = value.toJSON( key );
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if ( typeof rep === 'function' ) {
            value = rep.call( holder, key, value );
        }

// What happens next depends on the value's type.

        switch ( typeof value ) {
            case 'string':
                return quote( value );

            case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

                return isFinite( value ) ? String( value ) : 'null';

            case 'boolean':
            case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

                return String( value );

// If the type is 'object', we might be dealing with an object or an array or
// null.

            case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

                if ( !value ) {
                    return 'null';
                }

// Make an array to hold the partial results of stringifying this object value.

                gap += indent;
                partial = [];

// Is the value an array?

                if ( Object.prototype.toString.apply( value ) === '[object Array]' ) {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                    length = value.length;
                    for ( i = 0; i < length; i += 1 ) {
                        partial[i] = str( i, value ) || 'null';
                    }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                    v = partial.length === 0
                        ? '[]'
                        : gap
                        ? '[\n' + gap + partial.join( ',\n' + gap ) + '\n' + mind + ']'
                        : '[' + partial.join( ',' ) + ']';
                    gap = mind;
                    return v;
                }

// If the replacer is an array, use it to select the members to be stringified.

                if ( rep && typeof rep === 'object' ) {
                    length = rep.length;
                    for ( i = 0; i < length; i += 1 ) {
                        if ( typeof rep[i] === 'string' ) {
                            k = rep[i];
                            v = str( k, value );
                            if ( v ) {
                                partial.push( quote( k ) + (gap ? ': ' : ':') + v );
                            }
                        }
                    }
                } else {

// Otherwise, iterate through all of the keys in the object.

                    for ( k in value ) {
                        if ( Object.prototype.hasOwnProperty.call( value, k ) ) {
                            v = str( k, value );
                            if ( v ) {
                                partial.push( quote( k ) + (gap ? ': ' : ':') + v );
                            }
                        }
                    }
                }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

                v = partial.length === 0
                    ? '{}'
                    : gap
                    ? '{\n' + gap + partial.join( ',\n' + gap ) + '\n' + mind + '}'
                    : '{' + partial.join( ',' ) + '}';
                gap = mind;
                return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if ( typeof JSON.stringify !== 'function' ) {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function ( value, replacer, space ) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if ( typeof space === 'number' ) {
                for ( i = 0; i < space; i += 1 ) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if ( typeof space === 'string' ) {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if ( replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number') ) {
                throw new Error( 'JSON.stringify' );
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str( '', {'': value} );
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if ( typeof JSON.parse !== 'function' ) {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function ( text, reviver ) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk( holder, key ) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if ( value && typeof value === 'object' ) {
                    for ( k in value ) {
                        if ( Object.prototype.hasOwnProperty.call( value, k ) ) {
                            v = walk( value, k );
                            if ( v !== undefined ) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call( holder, key, value );
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String( text );
            cx.lastIndex = 0;
            if ( cx.test( text ) ) {
                text = text.replace( cx, function ( a ) {
                    return '\\u' +
                        ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
                } );
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if ( /^[\],:{}\s]*$/
                .test( text.replace( /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@' )
                    .replace( /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']' )
                    .replace( /(?:^|:|,)(?:\s*\[)+/g, '' ) ) ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval( '(' + text + ')' );

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk( {'': j}, '' )
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError( 'JSON.parse' );
        };
    }
}());
