<img src="examples/lead-booster-analytics.png" width="400" height="98" alt="Lead Booster Analytics">

# brytescore.js [![Build Status](https://travis-ci.org/Brytecore/brytescore.js.svg?branch=master)](https://travis-ci.org/Brytecore/brytescore.js)

brytescore.js is the open-source library that connects your website with the Brytescore API. The
Brytescore API allows you to track your users' behavior and score their engagement.

## Getting Started

To begin tracking user behavior events, paste the following JavaScript snippet into your
website before the closing `</head>` tag. The `DEMO_API_KEY` parameter for `setAPIKey` must be replaced with your
Brytescore API Key.

```
<!-- Brytescore -->
<script>
(function(a,c,g,e,d,f,b){e[d]=e[d]||function(){(e[d].q=e[d].q||[]).push(arguments)};e[d].t=1*new Date();
b=a.getElementsByTagName(c)[0];f=a.createElement(c);f.async=1;f.src=g;b.parentNode.insertBefore(f,b)})
(document,'script','https://cdn.brytecore.com/brytescore.js/brytescore.min.js',window,'brytescore');
brytescore('setAPIKey','DEMO_API_KEY');
brytescore('pageView',{});
brytescore("load","https://cdn.brytecore.com/packages/realestate/package.json");
</script>
<!-- End Brytescore -->
```

## Documentation

Full documentation on this library is available at [www.brytecore.com/docs/](http://www.brytecore.com/docs).
