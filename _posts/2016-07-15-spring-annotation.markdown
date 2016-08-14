---
layout: post
comments: true
title:  "Spring - Annotations"
date:   2016-07-15 14:55:38 +0900
categories: spring annotation
---

# Spring

## @Configuration
## @ComponentScan
## @EnableAutoConfiguration
## @Bean
## @Component
사용 범위 : 타입  
빈으로 등록될 대상으로 지정시켜 준다.  
스프링 컨테이너에 Bean으로 생성된다.  

## @Service
## @Repository
## @Controller
## @Autowired
사용 범위 : 생성자, 필드, 메소드  
의존하는 객체를 자동으로 삽입시켜 준다.  
타입을 이용한 프로퍼티 자동설정기능을 제공 (타입에 의한 자동 와이어링-Type-driven)  
Type 기반 Bean 주입  

## @Resource
Name 기반 Bean 주입  

## @RestController
## @RequestMapping
## @RequestParam

# Spring Boot

## @SpringBootApplication
