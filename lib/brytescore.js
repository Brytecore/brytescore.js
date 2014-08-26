/*! Brytecore library */

( function( window, undefined ) {
	'use strict';

	/*** Compatibility checks ***/

	/**
	 * Array.indexOf()
	 */
	if ( ! Array.prototype.indexOf ) {
		Array.prototype.indexOf = function ( find, i /*opt*/ ) {
			if ( i === undefined ) i = 0;
			if ( i < 0 ) i += this.length;
			if ( i < 0 ) i = 0;
			for ( var n = this.length; i < n; i++ )
				if ( i in this && this[i] === find )
					return i;
			return -1;
		};
	}

    /*** Private Variables ***/

	var items = brytescore.q,				// Assign the queue to var, so it can be safely overridden
		functionName,						// The function run by the client
		listeners = [],						// Registered event listeners
		xhr,								// XML HTTP Request object
		url = 'http://api.brytecore.net',	// Path to the API
		i,									// Counter
		oneYear = 31536000000,				// One year, in milliseconds
        APIKey,                             // Brytescore API Key
		anonymousId,						// Brytescore uuid
		userId,								// Client user id
		sessionId,							// Brytescore session id
		pageViewId,							// Brytescore page view id
        heartbeatID;                        // the id of the heartbeat timer incase it needs to be stopped

	/*** Private methods ***/

	/**
	 * Handle an error.
	 *
	 * @param msg
	 */
	var returnError = function( msg ) {
		console.log( 'Brytescore error: ' + msg );
	};

	/**
	 * Get the data for a specific cookie.
	 *
	 * @param name
	 * @returns {*}
	 */
	var readCookie = function( cname ) {
        var name = cname + "=";
        var ca = document.cookie.split( ';' );
        for ( var i = 0; i < ca.length; i++ ) {
            var c = ca[i];
            while ( c.charAt( 0 ) == ' ' ) c = c.substring( 1 );
            if ( c.indexOf( name ) != -1 ) return c.substring( name.length, c.length );
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
	var writeCookie = function( name, data, expiry ) {
		var domain = window.location.hostname;

		if ( 'localhost' == domain.substring( domain.lastIndexOf( '.' ) ) ) {
			domain = '';
		} else {
			domain = '; domain=.' + domain.substring( domain.lastIndexOf( '.', domain.lastIndexOf( '.' ) - 1 ) + 1 );
		}

		name = encodeURIComponent( name );
		data = encodeURIComponent( data );

		if ( null !== expiry ) {
			document.cookie = name + '=' + data + '; expires=' + expiry + domain + '; path=/';
		} else {
			document.cookie = name + '=' + data + '; path=/';
		}

	};

	/*** Brytescore definition ***/

	/**
	 * Redefine the brytescore function to call public methods instead of
	 * adding to .q array.
	 */
	window.brytescore = function() {
		var args = [].slice.call( arguments ),
			method;

        //console.log(args);
		// Ensure there is a function name passed
		if ( 0 === args.length ) {
			returnError( 'Invalid method name.' );
		}

		// Shift the function name off the array
		functionName = args.shift();

		method = window['brytescore'][functionName];

		// Run function if it exists, passing the args
		// Otherwise, push it onto the queue
		if ( 'function' === typeof method ) {
			method.apply( window,  args );
		} else {
			brytescore.q.push( [].slice.call( arguments ) );
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

    //Authentication function
    window.brytescore.authenticate = function( userID, data ) {
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

    //Update any user information
    window.brytescore.updateUserInfo = function ( userID, data ) {
        var undefined;
        if( undefined === userId || userID != userId ) {
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
        brytescore.track( 'updateUserInfo', data);
    };


    // Set API Key function
    window.brytescore.setAPIKey = function( apiKey ) {
        //console.log("api Key set: " + apiKey );
        APIKey = apiKey;
    };

    // start a pageView
    window.brytescore.pageview = function( data ) {
        pageViewId = brytescore.generateUUID();
        brytescore.track( 'pageview', data );
        heartbeatID = window.setInterval( function() {
            brytescore.heartBeat();
        }, 15000 );
    };

    window.brytescore.killHeartbeat = function () {
      clearInterval(heartbeatID);
    };


	// Main track function
	window.brytescore.track = function ( eventName, data ) {
        sendRequest( 'track', eventName, data );
	};

    window.brytescore.heartBeat = function () {
        window.brytescore.track( 'heartBeat', {} );
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
            if ( AJAX_req.readyState == 4 && AJAX_req.status == 200 ) {

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
                    window.brytescore.factory = function ( eventName, packageNamespace ) {
                        return function () {
                            return window.brytescore.track( packageNamespace + "." + eventName, arguments[0] );
                        };
                    };
                    window.brytescore[namespace][prop] = window.brytescore.factory( prop, namespace );

                    //loop through the queue and process the items for this function and remove them from the queue
                    for ( var i = 0; i < window.brytescore.q.length; i++ ) {
                        if ( namespace + "." + prop == window.brytescore.q[i][0] ) {
                            window.brytescore[namespace][prop]( window.brytescore.q[i][1] );
                            window.brytescore.q.splice( i, 1 );
                        }
                    }
                }
            }
        };
        AJAX_req.send();
    };

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
                'hostname': location.hostname,
                'apiKey': APIKey,
                'anonymousId' : anonymousId,
                'userId' : userId,
                'pageViewId' : pageViewId,
                'sessionId' : sessionId,
                'data' : data || {}
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
        } else if ( typeof XDomainRequest != 'undefined' ) {
            // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open( method, url );
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
                        console.log( response );
                        // TODO: Something here?
                        break;
                }
            }
        }
    }


    /**
     * Fast UUID generator, RFC4122 version 4 compliant.
     * @author Jeff Ward (jcward.com).
     * @license MIT license
     * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
     **/
    var lut = []; for ( i = 0; i < 256; i++ ) { lut[i] = (i < 16 ? '0' : '') + (i).toString( 16 );}
    window.brytescore.generateUUID = function() {
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
            userId,
			browserString;

        //console.log( readCookie( 'brytescore_uu' ) );
		if ( null !== bc ) {
            values =  JSON.parse(decodeURIComponent( bc ) );
			anonymousId = values.aid;
			userId = values.uid;
		} else {
			anonymousId = brytescore.generateUUID();
			userId = '';
		}

		data = JSON.stringify( {
			'aid': anonymousId,
			'uid': userId
		});

		date = new Date();
		date.setTime( date.getTime() + oneYear );

		writeCookie( 'brytescore_uu', data, date.toUTCString() );

		// Check session cookie
		if ( null !== sc ) {
			values =  JSON.parse( decodeURIComponent( sc ) );
			sessionId = values.sid;
		} else {
			sessionId = brytescore.generateUUID();
			browserString = navigator.userAgent;

			data = JSON.stringify( {
				'sid': sessionId,
				'brw': browserString,
				'aid': anonymousId
			});

			writeCookie( 'brytescore_session', data, null );

            //waiting to send created event until session data is created.
            //only send event if cookie was created for first time.
            if ( null === bc ) {
                brytescore.track( 'brytescore_uuid_created', { 'anonymous_id': anonymousId } );
            }
            //only send event if cookie was created for first time.
            if ( null === sc ) {
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
	window.brytescore.is_loaded = function( package_name ) {
		console.log( 'is_loaded function called for package ' + package_name );
	};

	/**
	 * Process the internally queued actions that were present before initial object creation.
	 */
	window.brytescore.processQueue = function() {
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
        var undefined;
        //loop through the queue and process the setAPIKey and remove it from the queue
        if( undefined === APIKey ) {
            for ( i = 0; i < items.length; i++ ) {
                //console.log( items[i] );
                if( 'setapikey' === items[i][0].toLowerCase() ){
                    brytescore.apply( document, items[i] );
                    items.splice(i,1);
                }
            }
        }
		brytescore.updateCookies();
		brytescore.processQueue();
	};

	brytescore.init();

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
