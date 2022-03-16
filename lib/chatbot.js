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
				var res = JSON.parse( response );
				if ( res && true === res.data.is_enabled ) {
					var livechatLicense = res.data.key;
					var livechatgroup = res.data.group;
					var inboxid = res.data.inbox_id;
					var g = document.createElement("script"),
						s = document.head || document.getElementsByTagName("head")[0];

					g.src="https://chatbot.brytecore.net/app/js/sdk.js";
					s.parentNode.insertBefore(g,s);
					g.onload=function(){
						window.chatwootSDK.run({
							websiteToken: inboxid,
							baseUrl: ''
						});
					};
				}
			} catch ( error ) {
				console.error( error );
			}
		}
	}
}( window ) );
