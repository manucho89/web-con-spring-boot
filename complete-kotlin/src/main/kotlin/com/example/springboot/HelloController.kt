package com.example.springboot

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
ﬁﬁﬁ
@RestController
class HelloController {

  @GetMapping("/")
  fun index(): String = "Greetings from Spring Boot!"
}
