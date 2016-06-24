---
layout: post
comments: true
title:  "JAVA - Array (배열)"
date:   2016-06-24 12:18:38 +0900
categories: java array
---
[https://docs.oracle.com/javase/specs/jls/se8/html/jls-10.html][javase-specs-arrays]

[https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html][javase-api-arrays]

[https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html][javase-tutorial-arrays]


대괄호 []는 타입 뒤에 붙을 수도 있고 변수명 뒤에 붙을 수도 있다.
{% highlight java %}
int[] intArray;
int intArray[];
{% endhighlight %}

한꺼번에 선언도 가능하다.
{% highlight java %}
int[] intArray1, intArray2, intArray3;
{% endhighlight %}

초기화 할 값이 있는 경우 아래와 같은 간단한 방법으로 가능하다.
{% highlight java %}
int[] intArray = {1, 2, 3};
{% raw  %}
int[][] intArray = {{1, 2, 3}, {4, 5, 6}};
{% endraw  %}
{% endhighlight %}

단, 대괄호 []는 타입 뒤에만 가능하다.
{% highlight java %}
int intArray[] = {1, 2, 3};

Main.java:15: error: variable intArray is already defined in method main(String[])
		int intArray[] = {"???", "????"};
		       ^
1 error
{% endhighlight %}

미리 선언한 배열 변수에는 사용이 불가능 하다.
{% highlight java %}
int intArray[];
intArray = {1, 2, 3};

Main.java:15: error: illegal start of expression
		intArray = {1, 2, 3};
		           ^
Main.java:15: error: not a statement
		intArray = {1, 2, 3};
		            ^
Main.java:15: error: ';' expected
		intArray = {1, 2, 3};
		             ^
Main.java:17: error: class, interface, or enum expected
}
^
4 errors
{% endhighlight %}

[System.arraycopy][https://docs.oracle.com/javase/8/docs/api/java/lang/System.html#arraycopy-java.lang.Object-int-java.lang.Object-int-int-]
얕은 복사(shallow copy)

[javase-specs-arrays]: https://docs.oracle.com/javase/specs/jls/se7/html/jls-10.html
[javase-api-arrays]: https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html
[javase-tutorial-arrays]: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html
