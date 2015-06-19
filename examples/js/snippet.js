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
})( document, 'script', '../lib/brytescore.js', window, 'brytescore' );
brytescore( 'setAPIKey', 'DEMO_API_KEY' );
brytescore( 'pageview', { "campaign": "some_campaign", "campaignMedium": "some_campaignMedium", "campaignSource": 'some_campaignSource' } );
