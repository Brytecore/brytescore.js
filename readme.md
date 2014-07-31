# brytescore.js [![Build Status](https://travis-ci.org/Brytecore/brytescore.js.svg?branch=master)](https://travis-ci.org/Brytecore/brytescore.js)

brytescore.js is the open-source library that connects your website with the Brytescore API. The
Brytescore API allows you to track your users' behavior and score their engagement.

## Getting Started

To begin tracking user behavior events, paste the following JavaScript snippet into your
website before the closing `</head>` tag. The `XXXX` parameter must be replaced with your Brytescore
API Key.

```
<!-- Brytescore -->
<script>
window.brtscr = window.brtscr || [];
(function(b,r,y,t,e){t=b.createElement(r);e=b.getElementsByTagName(r)[0];
t.async=1;t.src=y;e.parentNode.insertBefore(t,e)
})(document,'script','//localhost:9090/brytescore.js');
</script>
<!-- End Brytescore -->
```

## Documentation

Full documentation on this library will be available soon at [www.brytescore.io](http://brytescore.io).