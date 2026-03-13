package com.eventiq.eventservice.service;

import com.eventiq.eventservice.exception.UnauthorizedException;
import com.eventiq.eventservice.security.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class AuthClient {
    private static final Logger log = LoggerFactory.getLogger(AuthClient.class);

    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthClient(RestTemplate restTemplate, @Value("${app.auth-service-url}") String authServiceUrl) {
        this.restTemplate = restTemplate;
        this.authServiceUrl = authServiceUrl;
    }

    public UserProfile fetchProfile(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid authorization header");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    authServiceUrl + "/auth/profile",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new UnauthorizedException("Unable to validate user profile");
            }

            String id = String.valueOf(body.get("id"));
            String email = String.valueOf(body.get("email"));
            String role = String.valueOf(body.get("role"));

            if ("null".equals(id) || "null".equals(email) || "null".equals(role)) {
                throw new UnauthorizedException("Invalid profile payload from auth service");
            }

            return new UserProfile(id, email, role);
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (HttpClientErrorException ex) {
            log.warn("Auth profile validation failed: status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new UnauthorizedException("Unauthorized");
        } catch (Exception ex) {
            log.error("Auth service communication error", ex);
            throw new UnauthorizedException("Unable to validate authorization");
        }
    }
}
