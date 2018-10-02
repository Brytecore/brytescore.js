/*! Brytescore JavaScript library v0.3.4
 *  Copyright 2015-2017 Brytecore, Inc
 */
/*! Brytescore JavaScript library v0.3.4
 *  Copyright 2015-2017 Brytecore, Inc
 */

(function ( window, undefined ) { // eslint-disable-line no-shadow-restricted-names
	'use strict';

	/*** Compatibility checks ***/

	/**
	 * Array.indexOf()
	 * Add implementation for older browsers.
	 */
	if ( !Array.prototype.indexOf ) {
		/**
		 * Gets the index of the element in the array.
		 *
		 * @param {*} searchElement Element to locate in the array.
		 * @param {number} [fromIndex] The index to start the search at.
		 * @returns {number} The first index at which a given element can be found in the array, or -1 if it is not
		 *      present.
		 */
		Array.prototype.indexOf = function ( searchElement, fromIndex ) { // eslint-disable-line no-extend-native
			if ( undefined === fromIndex ) {
				fromIndex = 0;
			} else if ( 0 > fromIndex ) {
				fromIndex += this.length;
				if ( 0 > fromIndex ) {
					fromIndex = 0;
				}
			}

			for ( var n = this.length; fromIndex < n; fromIndex++ ) {
				if ( fromIndex in this && this[fromIndex] === searchElement ) {
					return fromIndex;
				}
			}
			return -1;
		};
	}

	/*** Private Variables ***/

	var items = brytescore.q,                   // Assign the queue to var, so it can be safely overridden
		functionName,                           // The function run by the client
		listeners = [],                         // Registered event listeners
		xhr,                                    // XML HTTP Request object
		url = 'https://api.brytecore.com',      // Path to the API
		oneYear = 31536000000,                  // One year, in milliseconds
		APIKey,                                 // Brytescore API Key
		anonymousId,                            // Brytescore uuid
		userId,                                 // Client user id
		sessionId,                              // Brytescore session id
		pageViewId,                             // Brytescore page view id
		heartBeatEventName = 'heartBeat',
		pageViewEventName = 'pageView',
		impersonateEventName = 'impersonate',
		startHeartBeatTime = 0,
		heartBeatInterval = 15000,
		totalPageViewTime = 0,
		heartbeatID,                            // The id of the heartbeat timer in case it needs to be stopped
		inactivityID = 0,                       // The id of the inactivity timer.
		inactivityLogoutID,                     // The id for the timer that will close session and all that.
		eventListenerHandle,                    // The handle for the event listeners
		oldHref = '',
		sessionTimeout = false,                 // Boolean for whether the session is timed out or not.
		library = 'javascript',
		libraryVersion = '0.3.5',    // The library version (set in package.json)
		schemaVersion = {
			'analytics': '0.3.1'
		},
		devMode = false,
		validationMode = false,
		impersonationMode = false,
		localUrl = '',
		xhrLocal = false,
		xhrError = false;

	/*** Private methods ***/

	/**
	 * Handle an error.
	 *
	 * @param {string} msg The error message.
	 */
	var returnError = function ( msg ) {
		console.log( 'Brytescore error: ' + msg ); // eslint-disable-line no-console
	};

	/**
	 * Get the data for a specific cookie.
	 *
	 * @param {string} name The cookie name.
	 * @returns {null|string} The cookie data.
	 */
	var readCookie = function ( name ) {
		name += '=';
		var ca = document.cookie.split( ';' );
		for ( var i = 0; i < ca.length; i++ ) {
			var c = ca[i];
			while ( ' ' === c.charAt( 0 ) ) {
				c = c.substring( 1 );
			}
			if ( -1 !== c.indexOf( name ) ) {
				return c.substring( name.length, c.length );
			}
		}
		return null;
	};

	/**
	 * Write a cookie for this domain.
	 *
	 * @param {string} name The cookie name.
	 * @param {string} data The data to write to the cookie.
	 * @param [expiry] The cookie expiration time.
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
	 * Redefine the brytescore function to call public methods instead of adding to .q array.
	 */
	window.brytescore = function () {
		// Check to see if the url has changed via ajax if so kill old pageView and start a new one
		if ( '' === oldHref ) {
			oldHref = location.href;
		}
		var newHref = location.href;
		if ( newHref !== oldHref ) {
			window.brytescore.killHeartbeat();
			window.brytescore.pageView( {} );
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
		// Package functionNames will show as namespace.functionName
		if ( 0 < functionName.indexOf( '.' ) ) {
			var arr = functionName.split( '.' );
			var namespace = arr[0];
			var prop = arr[1];
			// Check if the namespace is an object if it is not the package has not been loaded yet
			method = ('object' === typeof window.brytescore[namespace])
				? window.brytescore[namespace][prop]
				: null;
		} else {
			// Brytescore core function
			method = window.brytescore[functionName];
		}

		// Run function if it exists, passing the args
		// Otherwise, push it onto the queue
		if ( 'function' === typeof method ) {
			method.apply( window, args );
		} else {
			brytescore.q.push( [].slice.call( arguments ) );
		}

		//if ( 0 < brytescore.q.length ) {
		//	setTimeout( brytescore.processBrytescoreQueue, 1 );
		//}
		//// If document already ready to go, schedule the ready function to run
		//if ( 'complete' === document.readyState ) {
		//	setTimeout( brytescore.processBrytescoreQueue, 1 );
		//} else if ( !readyEventHandlersInstalled ) {
		//	// Otherwise if we don't have event handlers installed, install them
		//	if ( document.addEventListener ) {
		//		// First choice is DOMContentLoaded event
		//		document.addEventListener( 'DOMContentLoaded', brytescore.processBrytescoreQueue, false );
		//		// Backup is window load event
		//		window.addEventListener( 'load', brytescore.processBrytescoreQueue, false );
		//	} else {
		//		// Must be IE
		//		document.attachEvent( 'onreadystatechange', readyStateChange );
		//		window.attachEvent( 'onload', brytescore.processBrytescoreQueue );
		//	}
		//	readyEventHandlersInstalled = true;
		//}
	};

	// Re-add the queue
	window.brytescore.q = [];

	/***** Event Emitter ****/

	/**
	 * Adds a listener to an event.
	 *
	 * @param {string} event The event name.
	 * @param {function} callback The callback function.
	 */
	window.brytescore.on = function ( event, callback ) {
		listeners.push( event, callback );
	};

	/**
	 * The event emitter.
	 *
	 * @param {string} event The event name.
	 * @param {*} args The event arguments.
	 */
	window.brytescore.emit = function ( event, args ) {
	};

	/**
	 * Remove a single listener from an event.
	 *
	 * @param {string} event The event name.
	 * @param {function} callback The callback function to remove.
	 */
	window.brytescore.removeListener = function ( event, callback ) {
		var allListeners = listeners;
		for ( var i = 0; i < allListeners.length; i++ ) {
			if ( event === allListeners[i][0] && callback === allListeners[i][1] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	/**
	 * Remove all listeners from a single event.
	 *
	 * @param {string} event The event name.
	 */
	window.brytescore.removeAllListeners = function ( event ) {
		var allListeners = listeners;
		for ( var i = 0; i < allListeners.length; i++ ) {
			if ( event === allListeners[i][0] ) {
				listeners.splice( i, 1 );
			}
		}
	};

	/**
	 * Sends a user authentication event.
	 *
	 * @param {object} data The authentication data.
	 * @param {boolean} data.isImpersonating
	 * @param {object} data.userAccount
	 * @param {string} data.userAccount.id
	 */
	window.brytescore.authenticated = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		var userID = data.userAccount.id;
		// Check persistent cookie
		var bc = readCookie( 'brytescore_uu' ),
			values,
			cookieData,
			date;

		if ( null !== bc ) {
			values = JSON.parse( decodeURIComponent( bc ) );
			if ( '' !== values.uid && values.uid != userID ) {
				changeLoggedInUser( userID );
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

		brytescore.boost( 'authenticated', 'Logged In', data );
	};

	/**
	 * Sends a submittedForm event.
	 *
	 * @param {object} data The chat data.
	 * @param {boolean} data.isImpersonating
	 */
	window.brytescore.submittedForm = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		brytescore.boost( 'submittedForm', 'Submitted a Form', data );
	};

	/**
	 * Sends a startedChat event.
	 *
	 * @param {object} data The form data.
	 * @param {boolean} data.isImpersonating
	 */
	window.brytescore.startedChat = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		brytescore.boost( 'startedChat', 'User Started a Live Chat', data );
	};


	/**
	 * Updates a user's account information.
	 *
	 * @param {object} data The account data.
	 */
	window.brytescore.updatedUserInfo = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		var userID = data.userAccount.id;
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
		brytescore.boost( 'updatedUserInfo', 'Updated User Information', data );
	};

	/**
	 * Sends a new account registration event.
	 *
	 * @param {object} data The registration data.
	 * @param {boolean} data.isImpersonating
	 */
	window.brytescore.registeredAccount = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		var userID = data.userAccount.id;
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
		brytescore.boost( 'registeredAccount', 'Created a new account', data );
	};


	/**
	 * Sets the API key.
	 *
	 * @param {string} apiKey The API key.
	 */
	window.brytescore.setAPIKey = function ( apiKey ) {

		//console.log("api Key set: " + apiKey );
		APIKey = apiKey;
		//write to cookie for in case global variable isn't set for some reason
		var bc = readCookie( 'brytescore_apikey' ),
			values,
			cookieData;

		if ( null !== bc ) {
			values = JSON.parse( decodeURIComponent( bc ) );
			if ( '' !== values.apikey && values.apikey != apiKey ) {
				cookieData = JSON.stringify( {
					'apikey': apiKey
				} );

				writeCookie( 'brytescore_apikey', cookieData, null );
			}
		} else {
			cookieData = JSON.stringify( {
				'apikey': apiKey
			} );

			writeCookie( 'brytescore_apikey', cookieData, null );
		}
	};

	/**
	 * Sets dev mode.
	 * Logs events to the console instead of sending to the API.
	 *
	 * @param {boolean} enabled If true, then dev mode is enabled.
	 */
	window.brytescore.devMode = function ( enabled ) {
		devMode = enabled;
	};

	/**
	 * Sets validation mode.
	 *
	 * @param {boolean} enabled If true, then validation mode is enabled.
	 */
	window.brytescore.validationMode = function ( enabled ) {
		validationMode = enabled;
	};

	window.brytescore.localUrl = function ( data ) {
		localUrl = data;
	};

	/**
	 * Sets impersonation mode.
	 *
	 * @param {object} data The event data.
	 * @param {boolean} data.isImpersonating If true, then a user is being impersonated.
	 */
	window.brytescore.impersonate = function ( data ) {
		if ( data.isImpersonating ) {
			impersonationMode = true;
			brytescore.boost( impersonateEventName, 'Impersonated User', data );
		}
	};

	/**
	 * Start a pageView.
	 *
	 * @param {object} data The pageView data.
	 * @param {boolean} data.isImpersonating
	 * @param {string} data.pageUrl
	 * @param {string} data.pageTitle
	 * @param {string} data.referrer
	 */
	window.brytescore.pageView = function ( data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		totalPageViewTime = 0;
		//var newURL = window.location.protocol + '//' + window.location.host +  window.location.pathname;
		pageViewId = brytescore.generateUUID();
		data.pageUrl = window.location.href;
		data.pageTitle = document.title;
		data.referrer = document.referrer;
		brytescore.boost( pageViewEventName, 'Viewed a Page', data );

		// Update session cookie with new expiration date because of FF and Chrome issue on mac where they don't expire session cookies
		var browserUA = navigator.userAgent;
		data = JSON.stringify( {
			'sid': sessionId,
			'brw': browserUA,
			'aid': anonymousId
		} );

		var date = new Date();
		date.setTime( date.getTime() + 1800000 );  //30 minutes
		writeCookie( 'brytescore_session', data, date.toUTCString() );

		// Send the first heartbeat and start the timer
		brytescore.heartBeat();
		heartbeatID = window.setInterval( function () {
			var now = new Date().getTime();
			// Check if heartbeat should be dead?  Mac users when they shut the lid and reopen heartbeat continues where left off.
			if ( 0 === startHeartBeatTime || 1800000 > now - startHeartBeatTime ) {
				startHeartBeatTime = new Date().getTime();
				brytescore.heartBeat();
			} else {
				startHeartBeatTime = 0;
				// Session should be dead.  KillSession kills cookie
				killSession();
				// Write new session cookie
				window.brytescore.updateCookies();
				// Start a pageView which starts new heartbeat
				window.brytescore.pageView( {} );
			}
		}, heartBeatInterval );
	};

	/**
	 * Stops the heartbeat.
	 */
	window.brytescore.killHeartbeat = function () {
		clearInterval( heartbeatID );
	};

	/**
	 * Main boost function
	 *
	 * @param {string} eventName The event name.
	 * @param {string} eventDisplayName The event display name.
	 * @param {object} data The event data.
	 * @param {boolean} data.isImpersonating
	 */
	window.brytescore.boost = function ( eventName, eventDisplayName, data ) {
		if ( impersonationMode || data && data.isImpersonating ) {
			return;
		}

		sendRequest( 'boost', eventName, eventDisplayName, data );
	};

	/**
	 * Sends a heartbeat event.
	 */
	window.brytescore.heartBeat = function () {
		window.brytescore.boost( heartBeatEventName, 'Heartbeat', {elapsedTime: totalPageViewTime} );
		totalPageViewTime = totalPageViewTime + (heartBeatInterval / 1000);
	};

	/**
	 * Function to load json packages.
	 *
	 * @param {string} packageUrl The URL of the package.
	 */
	window.brytescore.load = function ( packageUrl, fallback ) {
		//var realestate = '{"name":"Brytecore Real Estate","namespace":"realestate","author":"Brytecore <info@brytecore.com>","version":"0.0.1","description":"Real estate visitor behavior and listing searches.","url":"","globals":{"listing":{"required":{"price":"number","mls_id":"string"},"optional":{"street_address":"string","street_address_2":"string","city":"string","state_province":"string","postal_code":"string","latitude":"string","longitude":"string"}}},"events":{"viewed_listing":{"display_name":"Viewed a listing","globals":["listing"]},"printed_driving_directions":{"display_name":"Printed driving directions","globals":["listing"]},"requested_showing":{"display_name":"Requested a showing","globals":["listing"]},"listing_impression":{"display_name":"Saw listing in search results","required":{"price":"number","mls_id":"string"},"optional":{"street_address":"string","street_address_2":"string","city":"string","state_province":"string","postal_code":"string","latitude":"string","longitude":"string"}}},"aggregates":{"average_listing_price":{"type":"average","aggregate_key":"mls_id","event":"viewed_listing","data_key":"price","scopes":["site","user","api_key"]},"listing_impressions":{"type":"count","event":"listing_impression","unique_key":"mls_id","scopes":["site","user","api_key"]},"median_listing_price":{"type":"median","aggregate_key":"mls_id","event":"viewed_listing","data_key":"price","scopes":["site","user","api_key"]}},"indicators":{"lookie-lou":{"type":"event","display_name":"Lookie-lou","event":{"name":"viewed_listing"},"weight":20},"driver":{"type":"repetition","display_name":"This guy likes to drive","events":[{"name": "printed_driving_directions","repititions": 5},{"name": "requested_showing","repetitions": 1}],"timeframe":"3d","weight":40},"go-getter":{"type":"sequence","display_name":"Im on the way!","events":[{"name": "viewed_listing","parameters": {"price": ["gte","400000"]}},{"name": "requested_showing"},{"name": "printed_driving_directions"}],"timeframe":"1d","weight":60}},"dependencies":{}}';
		//var json = JSON.parse( realestate );

		// AJAX request for the package
		var AjaxReq = createCORSRequest( 'GET', packageUrl );

		//AjaxReq.onreadystatechange = function () {
		//	if ( 4 === AjaxReq.readyState && 200 === AJAX_req.status ) {
		AjaxReq.onload = function () {
			var state = AjaxReq.readyState;
			if ( (!state || /loaded|complete/.test( state )) || (4 === AjaxReq.readyState && 200 === AjaxReq.status) ) {

				var json = JSON.parse( AjaxReq.responseText );
				// Get just the events object of the package
				var jsonEvents = json.events;
				// Get the namespace of the package
				var namespace = json.namespace;
				schemaVersion[namespace] = json.version;
				// Get an object of global scoped objects for required and optional parameters for the function
				//var jsonGlobals = json.globals;
				// Setup the namespace object so we can add functions to it
				window.brytescore[namespace] = {};
				// Loop through each Event in the object and create a function for each event.
				// window.brytescore.factory is a closure so that prop and namespace can be passed in and keep its value at the time of passing it in
				for ( var prop in jsonEvents ) {
					window.brytescore.factory = function ( eventName, packageNamespace, displayName ) {
						return function () {
							return window.brytescore.boost( packageNamespace + '.' + eventName, displayName, arguments[0] );
						};
					};
					window.brytescore[namespace][prop] = window.brytescore.factory( prop, namespace, jsonEvents[prop].displayName );

					// Loop through the queue and process the items for this function and remove them from the queue
					for ( var i = 0; i < window.brytescore.q.length; i++ ) {
						if ( namespace + '.' + prop === window.brytescore.q[i][0] ) {
							window.brytescore[namespace][prop]( window.brytescore.q[i][1] );
							//window.brytescore.q.splice( i, 1 );
						}
					}
				}
			}
		};
		AjaxReq.onerror = function () {
			if ( fallback ) {
				brytescore.load( fallback );
			}
		};
		AjaxReq.send();
		window.brytescore.q = [];
	};

	//window.brytescore.processBrytescoreQueue = function() {
	//	// Loop through the queue and process the items for this function and remove them from the queue
	//	for ( var i = 0; i < window.brytescore.q.length; i++ ) {
	//			if ( 49 === i ) {
	//				alert( 'function' === typeof window.brytescore[window.brytescore.q[i][0]] );
	//				alert(i);
	//			}
	//		if ( 'function' === typeof window.brytescore[window.brytescore.q[i][0]] ) {
	//			window.brytescore[window.brytescore.q[i][0]]( window.brytescore.q[i][1] );
	//			window.brytescore.q.splice( i, 1 );
	//		}
	//	}
	//};

	/*** XMLHttpRequest functions ***/

	/**
	 * Wrapper Function for making CORS calls to the API.
	 *
	 * @param {string} path
	 * @param {string} eventName
	 * @param {string} eventDisplayName
	 * @param {object} data
	 */
	function sendRequest( path, eventName, eventDisplayName, data ) {
		if ( !xhrLocal ) {
			xhr = createCORSRequest( 'Post', url + '/' + path );
		} else {
			if ( localUrl ) {
				xhr = new XMLHttpRequest();
				xhr.open( "POST", localUrl, true );
				xhr.setRequestHeader( "Content-type", "application/json" );
			}
		}

		if ( 'undefined' === typeof APIKey ) {
			var bc = readCookie( 'brytescore_apikey' ),
				values;

			if ( null !== bc ) {
				values = JSON.parse( decodeURIComponent( bc ) );
				if ( '' !== values.apikey ) {
					brytescore.setAPIKey( values.apikey );
				}
			}
		}

		if ( null !== xhr ) {
			var eventNameDot = eventName.indexOf( '.' );
			var eventData = {
				'event': eventName,
				'eventDisplayName': eventDisplayName,
				'hostName': location.hostname,
				'apiKey': APIKey,
				'anonymousId': anonymousId,
				'userId': userId.toString(),
				'pageViewId': pageViewId,
				'sessionId': sessionId,
				'library': library,
				'libraryVersion': libraryVersion,
				'schemaVersion': (-1 === eventNameDot) ? schemaVersion.analytics : schemaVersion[eventName.substring( 0, eventNameDot )],
				'data': data || {}
			};
			if ( xhrLocal ) {
				eventData.brytecoreUrl = url + '/' + path;
			}
			if ( validationMode ) {
				eventData.validationOnly = validationMode;
			}

			xhr.onload = serverResponse;
			xhr.onerror = function ( err ) {
				xhrLocal = true;
				sendRequest( path, eventName, eventDisplayName, data );
			};

			eventData = JSON.stringify( eventData );
			if ( devMode ) {
				console.log( eventData ); // eslint-disable-line no-console
			} else {
				xhr.send( eventData );
			}
		}
	}

	/**
	 * Performs a CORS request.
	 *
	 * @param {string} method The method type.
	 * @param {string} requestUrl The URL to send the request to.
	 * @returns {XMLHttpRequest}
	 */
	function createCORSRequest( method, requestUrl ) {
		var corsXhr = new XMLHttpRequest();
		if ( 'withCredentials' in corsXhr ) {
			// XHR for Chrome/Firefox/Opera/Safari.
			corsXhr.open( method, requestUrl, true );
			corsXhr.setRequestHeader( 'Content-Type', 'application/json' );
		} else if ( 'undefined' !== typeof XDomainRequest ) {
			// XDomainRequest for IE.
			if ( window.navigator.userAgent.match( /MSIE [6-9]/ ) ) {
				requestUrl = requestUrl.replace( /^http(?:s)?\:/, window.location.protocol );
				corsXhr = new XDomainRequest();
				corsXhr.open( method, requestUrl );
			} else {
				corsXhr = new XDomainRequest();
				corsXhr.open( method, requestUrl );
				corsXhr.setRequestHeader( 'Content-Type', 'application/json' );
			}
		} else {
			// CORS not supported.
			corsXhr = null;
		}
		return corsXhr;
	}


	/**
	 * The callback function that is called when the XMLHttpRequest is finished.
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
						returnError( 'The request was not properly formatted.' );
						break;
					default:
						//console.log( response );
						// TODO: Something here?
						break;
				}
			}
		}
	}

	/**
	 * Process a change in the logged in user.
	 *
	 * @param {string} userID The user ID.
	 */
	function changeLoggedInUser( userID ) {
		// If different userID than the one stored in the cookie, kill the session and write 2 new cookies
		// with new anonID, sessionID, pageViewID
		killSession();
		userId = userID;
		anonymousId = brytescore.generateUUID();
		sessionId = brytescore.generateUUID();
		var browserUA = navigator.userAgent;
		sessionTimeout = false;

		// Update cookie so the correct user is pulled.
		var cookieData = JSON.stringify( {
			'aid': anonymousId,
			'uid': userID
		} );

		var date = new Date();
		date.setTime( date.getTime() + oneYear );

		writeCookie( 'brytescore_uu', cookieData, date.toUTCString() );

		brytescore.boost( 'sessionStarted', 'started new session', {
			'sessionId': sessionId,
			'browserUA': browserUA,
			'anonymousId': anonymousId
		} );

		// Page view will update session cookie no need to write one.
		window.brytescore.pageView( {} );
	}

	/**
	 * Kills the session.
	 */
	function killSession() {
		brytescore.killHeartbeat();
		// Delete session cookie
		writeCookie( 'brytescore_session', null, new Date( 1974, 9, 18 ) );
		// Clear session variables
		sessionId = undefined;
		sessionTimeout = true;
		// Reset pageViewIDs
		pageViewId = undefined;
	}

	/**
	 * Starts the activity timer.
	 */
	var startInactivityTimer = function () {
		if ( 0 === inactivityID ) {
			if ( undefined !== eventListenerHandle ) {
				removeEventListeners();
			}

			// Check for killed session cookie
			if ( true === sessionTimeout ) {
				window.brytescore.updateCookies();
				window.brytescore.pageView( {} );
			}
			// Clears the timer if set
			clearInterval( inactivityID );
			clearTimeout( inactivityLogoutID );

			// Start a timer that will check every 5 minutes for activity.
			// At the end of 5 minutes event listeners will be added to the dom.
			inactivityID = window.setInterval( function () {
				addEventListeners();
			}, 300000 );
		}
	};

	/**
	 * Remove event listeners.
	 */
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

	/**
	 * Add event listeners.
	 */
	function addEventListeners() {
		// Clears the timer if set
		clearInterval( inactivityID );
		inactivityID = 0;
		// Start a timer that will fire in 25 minutes if no activity.
		inactivityLogoutID = setTimeout( function () {
			killSession();
		}, 1500000 );

		//var lastMove = 0;
		eventListenerHandle = window;
		if ( eventListenerHandle.addEventListener ) {       // For all major browsers, except IE 8 and earlier
			eventListenerHandle.addEventListener( 'mousemove', startInactivityTimer );
			eventListenerHandle.addEventListener( 'click', startInactivityTimer );
			eventListenerHandle.addEventListener( 'scroll', startInactivityTimer );
			eventListenerHandle.addEventListener( 'keyup', startInactivityTimer );
		} else if ( eventListenerHandle.attachEvent ) {     // For IE 8 and earlier versions
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
	for ( var i = 0; 256 > i; i++ ) {
		lut[i] = ((16 > i) ? '0' : '') + (i).toString( 16 );
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
			browserUA;

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
			browserUA = navigator.userAgent;

			data = JSON.stringify( {
				'sid': sessionId,
				'brw': browserUA,
				'aid': anonymousId
			} );

			date = new Date();
			date.setTime( date.getTime() + 1800000 );  //30 minutes
			writeCookie( 'brytescore_session', data, date.toUTCString() );

			// Waiting to send created event until session data is created.
			// Only send event if cookie was created for first time.
			if ( null === bc ) {
				brytescore.boost( 'brytescoreUUIDCreated', 'New user id Created', {'anonymousId': anonymousId} );
			}
			// Only send event if cookie was created for first time.
			if ( null === sc || true === sessionTimeout ) {
				sessionTimeout = false;
				brytescore.boost( 'sessionStarted', 'started new session', {
					'sessionId': sessionId,
					'browserUA': browserUA,
					'anonymousId': anonymousId
				} );
			}
		}

	};

//	/**
//	 * Retrieve a package from the API.
//	 *
//	 * @param {string} packageName The package name to retrieve.
//	 * @param {function} callback The callback function.
//	 */
//	window.brytescore.load = function( packageName, callback ) {
//
//	};

	/**
	 * Check to see if a certain package has loaded.
	 *
	 * @param {string} packageName The package name to check.
	 */
	window.brytescore.is_loaded = function ( packageName ) {
		console.log( 'is_loaded function called for package ' + packageName );
	};

	/**
	 * Process the internally queued actions that were present before initial object creation.
	 */
	window.brytescore.processQueue = function () {
		/*** Queue processing ***/

		// Get any current data out of the queue,
		// sending it to new brytescore function
		for ( var i = 0; i < items.length; i++ ) {
			//console.log( items[i] );
			brytescore.apply( document, items[i] );
		}
	};


	/**
	 * Initialize the object.
	 */
	window.brytescore.init = function () {
		// Loop through the queue and process the setAPIKey and remove it from the queue
		if ( 'undefined' === typeof APIKey ) {
			for ( var i = 0; i < items.length; i++ ) {
				if ( 'setapikey' === items[i][0].toLowerCase() ) {
					//brytescore.apply( document, items[i] );
					brytescore.setAPIKey( items[i][1] );
					items.splice( i, 1 );
				}
			}
		}
		//if we still didn't find apiKey read from the cookie
		if ( 'undefined' === typeof APIKey ) {
			var bc = readCookie( 'brytescore_apikey' ),
				values,
				cookieData,
				date;

			if ( null !== bc ) {
				values = JSON.parse( decodeURIComponent( bc ) );
				if ( '' !== values.apikey  ) {
					brytescore.setAPIKey( values.apikey );
				}
			}
		}
		brytescore.updateCookies();
		brytescore.processQueue();
		startInactivityTimer();
	};

	/**
	 * Loads dependent JavaScript files.
	 *
	 * @param {string} src The JavaScript source URL.
	 * @param {function} callback The callback function.
	 */
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

	// Check for JSON existence needed for IE 6 & 7
	if ( 'object' !== typeof JSON ) {
		loadJS( 'https://cdn.brytecore.com/brytescore.js/JSON3.min.js', function () {
			brytescore.init();
		} );
	} else {
		brytescore.init();
	}

}( window ));

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
 3. Log pageView
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
