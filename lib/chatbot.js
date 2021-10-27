// ChatBot
( function ( window, undefined ) {
	var chatapi = 'https://chat-api.brytecore.net';
	var xhttp = new XMLHttpRequest();
	var apikey = window.brytescore.getApiKey();
	var settingsURL = chatapi + '/settings/enabled?apiKey=' + apikey + '&domain=' + window.location.hostname + '&url=' + window.location.href;
	xhttp.onload = function() {
		startChat(xhttp.response);
	};
	xhttp.open('GET', settingsURL, true);
	xhttp.setRequestHeader('Content-type', 'application/json');
	xhttp.send();

	function startChat(response) {
		if(response) {
			var res = JSON.parse(response);
			var livechatLicense = res.data.key;
			if (res && true === res.data.is_enabled) {
				window.__lc = window.__lc || {};
				window.__lc.license = livechatLicense;
				(function (n, t, c) {
					function i(n) {
						return e._h ? e._h.apply(null, n) : e._q.push(n)
					}

					var e = {
						_q: [], _h: null, _v: "2.0", on: function () {
							i(["on", c.call(arguments)]);
						}, once: function () {
							i(["once", c.call(arguments)]);
						}, off: function () {
							i(["off", c.call(arguments)]);
						}, get: function () {
							if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
							return i(["get", c.call(arguments)]);
						}, call: function () {
							i(["call", c.call(arguments)]);
						}, init: function () {
							var n = t.createElement("script");
							n.async = !0, n.type = "text/javascript", n.src = "https://cdn.livechatinc.com/tracking.js", t.head.appendChild(n);
						}
					};
					!n.__lc.asyncInit && e.init(), n.LiveChatWidget = n.LiveChatWidget || e;
				}(window, document, [].slice));
			}
		}
	}
}( window ) );
