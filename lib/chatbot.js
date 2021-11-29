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
				var res = JSON.parse(response);
				if (res && true === res.data.is_enabled) {
					var livechatLicense = res.data.key;
					var livechatgroup = res.data.group;
					var url = window.location.href;
					window.__lc = window.__lc || {};
					window.__lc.license = livechatLicense;
					window.__lc.group = livechatgroup;
					window.__lc.chat_between_groups = false;
					window.__lc.params = [{name: 'aid', value:aid}, {name: 'uid', value:uid}];
					(function (n, t, c) {
						function i(n) {
							return e._h ? e._h.apply(null, n) : e._q.push(n);
						}
						var e = {
							_q: [],
							_h: null,
							_v: "2.0",
							on: function () {
								i(["on", c.call(arguments)]);
							},
							once: function () {
								i(["once", c.call(arguments)]);
							},
							off: function () {
								i(["off", c.call(arguments)]);
							},
							get: function () {
								if (!e._h)
									throw new Error(
										"[LiveChatWidget] You can't use getters before load."
									);
								return i(["get", c.call(arguments)]);
							},
							call: function () {
								i(["call", c.call(arguments)]);
							},
							init: function () {
								var n = t.createElement("script");
								(n.async = !0),
									(n.type = "text/javascript"),
									(n.src = "https://cdn.livechatinc.com/tracking.js"),
									t.head.appendChild(n);
							},
						};
						!n.__lc.asyncInit && e.init(), (n.LiveChatWidget = n.LiveChatWidget || e);
					})(window, document, [].slice);
					LiveChatWidget.call("set_session_variables", {
						cv_exit_event: "false",
					});

					if (window.location.href.indexOf("/bio") === -1) {
						LiveChatWidget.call("hide");
					}
					function onReady(initialData) {
						var chat_data = LiveChatWidget.get("chat_data");

						var threadID = chat_data.threadId;
						if (window.location.href.indexOf("/bio") === -1) {
							if (threadID != null) {
								LiveChatWidget.call("maximize");
							}
						}
					}
					LiveChatWidget.on("ready", onReady);
					document.onmouseleave = function () {
						if (window.__lc !== undefined) {
							LiveChatWidget.call("update_session_variables", {
								cv_exit_event: "true",
							});
						}
					};
					document.onmouseenter = function () {
						if (window.__lc !== undefined) {
							LiveChatWidget.call("update_session_variables", {
								cv_exit_event: "false",
							});
						}
					};
				}
			} catch (error) {
				console.error(error);
			}
		}
	};
}( window ) );
