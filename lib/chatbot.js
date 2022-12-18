// ChatBot
( function ( window, undefined ) {
	try {
		var chatapi = 'https://chat-api.brytecore.net';
		var xhttp = new XMLHttpRequest();
		var apikey = window.brytescore.getApiKey();
		var aid = window.brytescore.getAID();
		var uid = window.brytescore.getUID();
		var settingsURL = chatapi + '/settings/enabled?apiKey=' + apikey + '&domain=' + window.location.hostname + '&url=' + window.location.href;
		xhttp.onload = function () {
			startChat(xhttp.response, aid, uid);
		};
		xhttp.open('GET', settingsURL, true);
		xhttp.setRequestHeader('Content-type', 'application/json');
		xhttp.send();
	} catch(error) {
		console.error(error);
	}

	function startChat(response, aid, uid) {
		if(response) {
			try {
				//OUR chatwoot widget
				var res = JSON.parse( response );
				if ( res && true === res.data.is_enabled ) {
					switch (res.data.chat_version) {
						case 'brytebot':
							window.chatwootSettings = res.data.chatwoot_settings;
							var livechatLicense = res.data.key;
							var livechatgroup = res.data.group;
							var inboxid = res.data.inbox_id;
							var BASE_URL = res.data.baseurl;
							var g = document.createElement("script"),
								s = document.head || document.getElementsByTagName("head")[0];
		
							g.src="https://chatbot.brytecore.net/packs/js/sdk.js";
							s.parentNode.insertBefore(g,s);
							g.onload=function(){
								window.chatwootSDK.run({
									websiteToken: inboxid,
									baseUrl: BASE_URL
								});
							};
							break;
						case 'commversion':
							var livechatLicense = res.data.key;
							var livechatgroup = res.data.group;
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
								function i( n ) {
									return e._h ? e._h.apply( null, n ) : e._q.push( n );
								}
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
								!n.__lc.asyncInit && e.init(), ( n.LiveChatWidget = n.LiveChatWidget || e );
							} )( window, document, [].slice );

							function onReady( initialData ) {
								LiveChatWidget.call( 'set_session_variables', {
									cv_exit_event: 'false',
									aid: aid,
									uid: uid
								} );
								if (res && true !== res.data.is_visible) {
									LiveChatWidget.call( 'hide' );
								}
								var chat_data = LiveChatWidget.get( 'chat_data' );

								var threadID = chat_data.threadId;
								if (res && true !== res.data.is_visible) {
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
					
				}
			} catch ( error ) {
				console.error( error );
			}
		}
	}
}( window ) );
