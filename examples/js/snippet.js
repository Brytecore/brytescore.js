(function ( document, script, script_source, window, name, generated_script, calling_script ) {
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
})( document, 'script', 'https://cdn.brytecore.com/brytescore.js/brytescore.min.js', window, 'brytescore' );
brytescore( 'setAPIKey', 'DEMO_API_KEY' );
brytescore( 'pageview', {} );
brytescore( "load", "https://cdn.brytecore.com/packages/realestate/package.json" );
