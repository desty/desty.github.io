---
layout: post
comments: true
title:  "MySQL JDBC 드라이버 Time Zone 이슈"
date:   2016-08-14 10:47:38 +0900
categories: mysql jdbc timezone
---
mysql:mysql-connector-java:6.0.3  
DriverManager.getConnection("jdbc:mysql://localhost/test", "id", "password");  
위와 같이 테스트 진행시 다음과 같은 오류가 발생하였다.

Exception in thread "main" java.sql.SQLException: The server time zone value 'KST' is unrecognized or represents more than one time zone. You must configure either the server or JDBC driver (via the serverTimezone configuration property) to use a more specifc time zone value if you want to utilize time zone support.

아래의 수정으로 오류 제거가 가능했다.

'?serverTimezone=UTC' 추가  
DriverManager.getConnection("jdbc:mysql://localhost/test?serverTimezone=UTC", "id", "password");  
