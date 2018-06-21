(function ( document, script, script_source, window, name, fallback_source, generated_script, calling_script ) {
	'use strict';
	window[name] = window[name] || function() {
		( window[name].q = window[name].q || [] ).push( arguments );
	};
	window[name].t = 1 * new Date();
	calling_script = document.getElementsByTagName( script )[0];
	generated_script = document.createElement( script );
	generated_script.async = 1;
	generated_script.src = script_source;
	calling_script.parentNode.insertBefore( generated_script, calling_script );
	generated_script.onerror = function () {
		var generated_script_error = document.createElement( script );
		generated_script_error.async = 1;
		generated_script_error.src = fallback_source ? fallback_source : script_source;
		b.parentNode.insertBefore( generated_script_error, calling_script );
	};
})( document, 'script', 'https://cdn.brytecore.com/brytescore.js/brytescore.min.js', window, 'brytescore', "https://YOUR_SERVER_PATH/brytescore.min.js" );
brytescore( "localUrl", "http://127.0.0.1:4005/brytescore" );
brytescore( "setAPIKey", "YOUR_API_KEY" );
brytescore( "pageView", {} );
brytescore( "load", "https://cdn.brytecore.com/packages/realestate/package.json", "https://YOUR_SERVER_PATH/package.json" );
