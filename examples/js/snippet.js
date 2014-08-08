(function ( document, script, script_source, window, name, generated_script, calling_script ) {
	window[name] = window[name] || function() {
		( window[name].q = window[name].q || [] ).push( arguments );
	};
	window[name].t = 1 * new Date();
	generated_script = document.createElement( script );
	calling_script = document.getElementsByTagName( script )[0];
	generated_script.async = 1;
	generated_script.src = script_source;
	calling_script.parentNode.insertBefore( generated_script, calling_script )
})( document, 'script', '../lib/brytescore.js', window, 'brytescore' );
brytescore( 'api_key', 'DEMO_API_KEY' );
brytescore( 'pageview' );
console.log( 'calling it here' );
brytescore( 'is_loaded' );