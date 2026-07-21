package com.example.springboot;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5500")
public class HelloController {

    @GetMapping("/")
    public Map<String, String> hello() {
        return Map.of(
                "mensaje", "Hola desde Spring Boot",
                "version", "0.2",
                "estado", "OK"
        );
    }
}