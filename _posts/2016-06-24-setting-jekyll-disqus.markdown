---
layout: post
comments: true
title:  "jekyll 세팅 - Disqus"
date:   2016-06-24 09:57:38 +0900
categories: jekyll setting disqus
---
https://disqus.com/
Admin -> Add Sites

Installation -> Universal Code

_includes/disqus.html
{% highlight html %}
{% raw  %}
{% if page.comments %}
<div id="disqus_thread"></div>
<script>
  /**
   *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
   *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables
   */
  var disqus_config = function () {
      this.page.url = "https://desty.github.io{{ page.url }}";
      this.page.identifier = "{{ page.id }}";
  };
  (function() {  // DON'T EDIT BELOW THIS LINE
      var d = document, s = d.createElement('script');

      s.src = '//destynation.disqus.com/embed.js';

      s.setAttribute('data-timestamp', +new Date());
      (d.head || d.body).appendChild(s);
  })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
{% endif %}
{% endraw %}
{% endhighlight %}

_layouts/post.html
{% highlight html %}
...
<div class="post-content" itemprop="articleBody">
  {{ content }}
</div>
{% raw  %}
{% include disqus.html %}
{% endraw %}
{% endhighlight %}
