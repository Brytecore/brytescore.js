// ChatBot
( function ( window, undefined ) { // eslint-disable-line no-shadow-restricted-names
	try {
		var chatapi = 'https://chat-api.brytecore.com';
		var xhttp = new XMLHttpRequest();
		var apikey = window.brytescore.getApiKey();
		var aid = window.brytescore.getAID();
		var uid = window.brytescore.getUID();
		var settingsURL = chatapi + '/settings/enabled?apiKey=' + apikey + '&domain=' + window.location.hostname + '&url=' + window.location.href;
		xhttp.onload = function () {
			startChat( xhttp.response, aid, uid );
		};
		xhttp.open( 'GET', settingsURL, true );
		xhttp.setRequestHeader( 'Content-type', 'application/json' );
		xhttp.send();
	} catch ( error ) {
		console.error( error );
	}

	function loadCvChatScript() {
		var s = document.createElement("script");
		s.src = "https://cht-srvc.net/api/lc.js?client=rn_reece_nichols";
		s.async = true;
		document.body.appendChild(s);
		console.log("LiveChat script loaded");
	}

	function initializeLiveChat() {
		var attempts = 0;
		var maxAttempts = 7;
		var retryDelay = 300;
		var _tryInit = function tryInit() {
			if (typeof LiveChatWidget === "undefined" || window.__lc_inited) {
			if (attempts < maxAttempts) {
				attempts++;
				setTimeout(_tryInit, retryDelay);
			} else {
				console.error("Failed to initialize LiveChat script");
			}
			} else {
			LiveChatWidget.init();
			LiveChatWidget.on("ready", function () {
				LiveChatWidget.get("customer_data", function (data) {
				var status = data === null || data === void 0 ? void 0 : data.status;
				if (status === "chatting" || status === "queued") {
					document.body.classList.remove("chat-hidden");
				}
				});
			});
			}
		};
		_tryInit();
	}
	
	function setInitialState() {
		document.body.classList.add("chat-hidden");
	}

	function markUserInteraction() {
		setTimeout(function () {
			document.body.classList.remove("chat-hidden");
			console.log("Chat widget visible after interaction");
		}, 100);
	}


	function startChat( response, aid, uid ) {
		if ( response ) {
			try {
				//OUR chatwoot widget
				var res = JSON.parse( response );
				if ( res && true === res.data.is_enabled ) {
					var livechatLicense;
					var livechatgroup;
					switch ( res.data.chat_version ) {
						case 'chatbot_v2':
							window.__be = window.__be || {};
							window.__be.id = res.data.key;

							( function() {
								var be = document.createElement( 'script' );
								be.type = 'text/javascript';
								be.async = true;
								be.src = 'https://cdn.chatbot.com/widget/plugin.js';
								var s = document.getElementsByTagName( 'script' )[0];
								s.parentNode.insertBefore( be, s );
							} ) ();

							if ( '' === uid ) {
								uid = aid;
							}
							window.BE_API = window.BE_API || {};
							window.BE_API.onLoad = function() {
								window.BE_API.setUserAttributes( {
									aid: aid,
									uid: uid,
									apiKey: apikey
								} );
							};
							window.BE_API.onMessage = function ( result ) {
								brytescore( 'sentChatMessage',  result );
							};
							break;
						case 'brytebot':
							window.chatwootSettings = res.data.chatwoot_settings;
							livechatLicense = res.data.key;
							livechatgroup = res.data.group;
							var inboxid = res.data.inbox_id;
							var BASE_URL = res.data.baseurl;
							var g = document.createElement( 'script' ),
								s = document.head || document.getElementsByTagName( 'head' )[0];
		
							g.src = 'https://chatbot.brytecore.com/packs/js/sdk.js';
							s.parentNode.insertBefore( g,s );
							g.onload = function() {
								window.chatwootSDK.run( {
									websiteToken: inboxid,
									baseUrl: BASE_URL
								} );
							};
							break;
						case 'commversion': {
							livechatLicense = res.data.key;
							livechatgroup = res.data.group;
							// var url = window.location.href;
							// console.log(url);
							// console.log(livechatgroup);
							// console.log(livechatLicense);
							// console.log(aid);
							// console.log(uid);
							window.__lc = window.__lc || {};
							window.__lc.license = livechatLicense;
							window.__lc.group = livechatgroup;
							window.__lc.chat_between_groups = false;
							// window.__lc.params = [{name: 'aid', value:aid}, {name: 'uid', value:uid}];
							( function ( n, t, c ) {
								var e = {
									_q: [],
									_h: null,
									_v: '2.0',
									on: function () {
										i( [ 'on', c.call( arguments ) ] );
									},
									once: function () {
										i( [ 'once', c.call( arguments ) ] );
									},
									off: function () {
										i( [ 'off', c.call( arguments ) ] );
									},
									get: function () {
										if ( !e._h )
											throw new Error(
												"[LiveChatWidget] You can't use getters before load."
											);
										return i( [ 'get', c.call( arguments ) ] );
									},
									call: function () {
										i( [ 'call', c.call( arguments ) ] );
									},
									init: function () {
										var n = t.createElement( 'script' );
										( n.async = !0 ),
											( n.type = 'text/javascript' ),
											( n.src = 'https://cdn.livechatinc.com/tracking.js' ),
											t.head.appendChild( n );
									},
								};
								function i( n ) {
									return e._h ? e._h.apply( null, n ) : e._q.push( n );
								}
								!n.__lc.asyncInit && e.init(), ( n.LiveChatWidget = n.LiveChatWidget || e );
							} )( window, document, [].slice );

							function onReady( initialData ) { // eslint-disable-line no-inner-declarations
								LiveChatWidget.call( 'set_session_variables', {
									cv_exit_event: 'false',
									aid: aid,
									uid: uid
								} );
								if ( res && true !== res.data.is_visible ) {
									LiveChatWidget.call( 'hide' );
								}
								var chat_data = LiveChatWidget.get( 'chat_data' );

								var threadID = chat_data.threadId;
								if ( res && true !== res.data.is_visible ) {
									if ( null !== threadID ) {
										LiveChatWidget.call( 'maximize' );
									}
								}
							}

							LiveChatWidget.on( 'ready', onReady );
							document.onmouseleave = function () {
								if ( window.__lc !== undefined ) {
									LiveChatWidget.call( 'update_session_variables', {
										cv_exit_event: 'true',
									} );
								}
							};
							document.onmouseenter = function () {
								if ( window.__lc !== undefined ) {
									LiveChatWidget.call( 'update_session_variables', {
										cv_exit_event: 'false',
									} );
								}
							};
							break;
						}
						case 'commversion_v2':
							var style = document.createElement("style");
							style.textContent = "\n  body.chat-hidden #chat-widget-container {\n    display: none !important;\n    pointer-events: none !important;\n    z-index: -1 !important;\n  }\n";
							document.head.appendChild(style);

							window.__lc = window.__lc || {};
							Object.assign(window.__lc, {
								asyncInit: true
							});
							setInitialState();
							loadCvChatScript();
							initializeLiveChat();
							// Listen for first user interaction
							["click", "keydown", "scroll", "touchstart"].forEach(function (evt) {
								return window.addEventListener(evt, markUserInteraction, {
									once: true
								});
							});
							break;
					}
				}
			} catch ( error ) {
				console.error( error );
			}
		}
	}
}( window ) );