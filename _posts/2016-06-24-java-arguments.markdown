---
layout: post
comments: true
title:  "JAVA - Classes . Arguments (매개변수)"
date:   2016-06-24 17:13:38 +0900
categories: java classes arguments
---
[https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html][javase-tutorial-arguemtns]

## 매개변수의 수가 가변일때
생략 부호(ellipsis, three dots, ...)를 사용한다.
{% highlight java %}
int print(String ... args) { ... }

print("가");
print("가", "나");
print("가", "나", "다");
{% endhighlight %}

[javase-tutorial-arguemtns]: https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html
