package com.eventiq.eventservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class AuthClient {
    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthClient(RestTemplate restTemplate, @Value("${app.auth-service-url}") String authServiceUrl) {
        this.restTemplate = restTemplate;
        this.authServiceUrl = authServiceUrl;
    }

    public Map<String, Object> fetchProfile(String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);

        ResponseEntity<Map> response = restTemplate.exchange(
                authServiceUrl + "/auth/profile",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        return response.getBody();
    }
}
