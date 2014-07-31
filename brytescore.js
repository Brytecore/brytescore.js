/*! Brytescore API */

( function ( window, document, undefined ) {
	var cont = document.createElement( 'script' );
	cont.type = 'text/javascript';
	cont.async = true;
	cont.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName( 'script' )[0];
	s.parentNode.insertBefore( ga, s );
}( window, document ) );
