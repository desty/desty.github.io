---
layout: post
comments: true
title:  "jekyll, github pages 세팅"
date:   2016-06-23 11:36:38 +0900
categories: jekyll setting github pages
---
1. 우선 자신의 깃허브 저장소를 만든다.

    (만들때 저장소명을 "{github 계정명}.github.io"으로 한다.)

2. 로컬에 github 저장소를 세팅한다.
{% highlight bash %}
git clone https://github.com/desty/desty.github.io.git
{% endhighlight %}

3. jekyll을 자신의 로컬에 설치한다.

    [https://jekyllrb.com/][https://jekyllrb.com/]  
    [https://jekyllrb-ko.github.io/][https://jekyllrb-ko.github.io/]

4. jekyll를 세팅한다.
{% highlight bash %}
cd desty.github.io
jekyll new ./
{% endhighlight %}

5. jekyll 세팅을 로컬에서 확인한다.
{% highlight bash %}
jekyll serve --watch
{% endhighlight %}

6. github에 올려 제대로 나오는지 확인한다.
{% highlight bash %}
git add .
git commit -m "jekyll init"
git push
{% endhighlight %}
