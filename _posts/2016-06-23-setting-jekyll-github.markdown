---
layout: post
comments: true
title:  "jekyll 세팅"
date:   2016-06-23 11:36:38 +0900
categories: jekyll setting github
---
{% highlight bash %}
git clone https://github.com/desty/desty.github.io.git
cd desty.github.io
jekyll new ./
jekyll serve --watch
git add .
git commit -m "jekyll new"
git push
{% endhighlight %}
