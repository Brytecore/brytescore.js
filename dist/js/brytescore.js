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
		httpURL = 'http://api.brytescore.com',
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
		startHeartBeatTime = 0,
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
			while ( ' ' === c.charAt( 0 ) ) {
				c = c.substring( 1 );
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
		if ( 0 < functionName.indexOf( '.' ) ) {
			var arr = functionName.split( '.' );
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

		if ( null !== bc ) {
			values = JSON.parse( decodeURIComponent( bc ) );
			if ( values.uid !== '' && values.uid != userID ) {
				changeLoggedInUser();
			} else {
				anonymousId = values.aid;
			}
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

		brytescore.track( 'authenticate', 'Logged In', data );
	};

	window.brytescore.submittedForm = function ( data ) {
		brytescore.track( 'submittedForm', 'Submitted a Form', data );
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
		brytescore.track( 'updateUserInfo', 'Updated User Information', data );
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
		brytescore.track( 'registerAccount', 'Created a new account', data );
	};


	// Set API Key function
	window.brytescore.setAPIKey = function ( apiKey ) {
		//console.log("api Key set: " + apiKey );
		APIKey = apiKey;
	};

	// start a pageView
	window.brytescore.pageview = function ( data ) {
		totalPageViewTime = 0;
		//var newURL = window.location.protocol + '//' + window.location.host +  window.location.pathname;
		pageViewId = brytescore.generateUUID();
		data.pageUrl = window.location.href;
		data.pageTitle = document.title;
		data.referrer = document.referrer;
		brytescore.track( pageViewEventName, 'Viewed a Page', data );

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
			var now = new Date().getTime();
			//check if heartbeat should be dead?  Mac users when they shut the lid and reopen heartbeat continues where left off.
			if( startHeartBeatTime === 0 || now - startHeartBeatTime < 1800000 ) {
				startHeartBeatTime = new Date().getTime();
				brytescore.heartBeat();
			} else {
				//Session should be dead.  KillSession kills cookie
				killSession();
				//write new session cookie
				window.brytescore.updateCookies();
				//start a pageview which starts new heartbeat
				window.brytescore.pageview( {} );
			}
		}, heartBeatInterval );
	};

	window.brytescore.killHeartbeat = function () {
		clearInterval( heartbeatID );
	};


	// Main track function
	window.brytescore.track = function ( eventName, eventDisplayName, data ) {
		sendRequest( 'track', eventName, eventDisplayName, data );
	};

	window.brytescore.heartBeat = function () {
		window.brytescore.track( heartBeatEventName, 'Heartbeat', {elapsedTime: totalPageViewTime} );
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

		//AJAX_req.onreadystatechange = function () {
		//	if ( 4 === AJAX_req.readyState && 200 === AJAX_req.status ) {
		AJAX_req.onload = function () {
			var state = AJAX_req.readyState;
			if ( (!state || /loaded|complete/.test( state )) || ( 4 === AJAX_req.readyState && 200 === AJAX_req.status ) ) {

				var json = JSON.parse( AJAX_req.responseText );
				//get just the events object of the package
				var jsonEvents = json.events;
				//get the namespace of the package
				var namespace = json.namespace;
				// get an object of global scoped objects for required and optional parameters for the function
				//var jsonGlobals = json.globals;
				//setup the namespace object so we can add functions to it
				window.brytescore[namespace] = {};
				//loop through each Event in the object and create a function for each event.
				//window.brytescore.factory is a closure so that prop and namespace can be passed in and keep its value at the time of passing it in
				for ( var prop in jsonEvents ) {
					window.brytescore.factory = function ( eventName, packageNamespace, displayName ) {
						return function () {
							return window.brytescore.track( packageNamespace + '.' + eventName, displayName, arguments[0] );
						};
					};
					window.brytescore[namespace][prop] = window.brytescore.factory( prop, namespace, jsonEvents[prop]["displayName"] );

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
	 * @param {string} eventDisplayName
	 * @param {{}} data
	 */
	function sendRequest( path, eventName, eventDisplayName, data ) {
		xhr = createCORSRequest( 'Post', url + '/' + path );

		if ( null !== xhr ) {
			var eventData = {
				'event': eventName,
				'eventDisplayName': eventDisplayName,
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
			xhr.setRequestHeader( 'Content-Type', 'application/json' );
		} else if ( 'undefined' !== typeof XDomainRequest ) {
			// XDomainRequest for IE.
			if ( window.navigator.userAgent.match( /MSIE [6-9]/ ) ) {
				url = url.replace( /^http(?:s)?\:/, window.location.protocol );
				xhr = new XDomainRequest();
				xhr.open( method, url );
			} else {
				xhr = new XDomainRequest();
				xhr.open( method, url );
				xhr.setRequestHeader( 'Content-Type', 'application/json' );
			}
		} else {
			// CORS not supported.
			xhr = null;
		}
		return xhr;
	}


	/**
	 * The callback function that is called when the XMLHttpRequest is finished
	 */
	function serverResponse() {
		var response = xhr.responseText;
		if ( response && '' !== response ) {

			response = JSON.parse( response );

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

	function changeLoggedInUser() {
		//if different userID than the one stored in the cookie, kill the session and write 2 new cookies
		//with new anonID, sessionID, pageviewID
		killSession();
		userId = userID;
		anonymousId = brytescore.generateUUID();
		sessionId = brytescore.generateUUID();
		var browserString = navigator.userAgent;
		sessionTimeout = false;

		//update cookie so the correct user is pulled.
		var cookieData = JSON.stringify( {
			'aid': anonymousId,
			'uid': userID
		} );

		var date = new Date();
		date.setTime( date.getTime() + oneYear );

		writeCookie( 'brytescore_uu', cookieData, date.toUTCString() );

		brytescore.track( 'session_start', "started new session", {
			'sessionId': sessionId,
			'browserString': browserString,
			'anonymousId': anonymousId
		} );

		//page view will update session cookie no need to write one.
		window.brytescore.pageview( {} );
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
				window.brytescore.pageview( {} );
			}
			//clears the timer if set
			clearInterval( inactivityID );
			clearTimeout( inactivityLogoutID );

			//start a timer that will check every 5 minutes for activity.
			//at the end of 5 minutes event listeners will be added to the dom.
			inactivityID = window.setInterval( function () {
				addEventListeners();
			}, 300000 );
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
		lut[i] = ( (16 > i) ? '0' : '' ) + (i).toString( 16 );
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
				brytescore.track( 'brytescore_uuid_created', "New user id Created", {'anonymousId': anonymousId} );
			}
			//only send event if cookie was created for first time.
			if ( null === sc || true === sessionTimeout ) {
				sessionTimeout = false;
				brytescore.track( 'session_start', "started new session", {
					'sessionId': sessionId,
					'browserString': browserString,
					'anonymousId': anonymousId
				} );
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
		//loop through the queue and process the setAPIKey and remove it from the queue
		if ( 'undefined' === typeof APIKey ) {
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

	//function for loading dependet javascript files.
	function loadJS( src, callback ) {
		var s = document.createElement( 'script' );
		s.src = src;
		s.async = true;
		s.onreadystatechange = s.onload = function () {
			var state = s.readyState;
			if ( !callback.done && (!state || /loaded|complete/.test( state )) ) {
				callback.done = true;
				callback();
			}
		};
		document.getElementsByTagName( 'head' )[0].appendChild( s );
	}

	//check for JSON existence needed for ie 6&7
	if ( typeof JSON !== 'object' ) {
		loadJS( 'http://cdn.brytecore.net/brytescore.js/JSON3.min.js', function () {
			brytescore.init();
		} );
	} else {
		brytescore.init();
	}

}( window ) );

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
