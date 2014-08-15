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
(function(a,c,g,e,d,f,b){e[d]=e[d]||function(){(e[d].q=e[d].q||[]).push(arguments)};e[d].t=1*new Date();
b=a.getElementsByTagName(c)[0];f=a.createElement(c);f.async=1;f.src=g;
b.parentNode.insertBefore(f,b)})(document,"script","../lib/brytescore.js",window,"brytescore");
brytescore("api_key","DEMO_API_KEY");
brytescore("pageview");
</script>
<!-- End Brytescore -->
```

## Documentation

Full documentation on this library will be available soon at [www.brytescore.com](http://brytescore.com).