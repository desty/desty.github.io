---
layout: post
title:  "jekyll 세팅 - 구글 검색 (webmaster)"
date:   2016-06-23 11:57:38 +0900
categories: jekyll setting google search webmaster ga
---
https://www.google.com/webmasters/tools/home?hl=ko
https://analytics.google.com/analytics/web

_includes/analytics.html
{% highlight html %}
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', '{GA 추적코드}', 'auto');
  ga('send', 'pageview');
</script>
{% endhighlight %}

_includes/head.html
{% highlight html %}
...
  {% if jekyll.environment == 'production' %}
  {% include analytics.html %}
  {% endif %}
</head>
{% endhighlight %}
