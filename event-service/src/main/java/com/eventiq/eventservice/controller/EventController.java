package com.eventiq.eventservice.controller;

import com.eventiq.eventservice.dto.CreateEventRequest;
import com.eventiq.eventservice.dto.UpdateEventRequest;
import com.eventiq.eventservice.model.Event;
import com.eventiq.eventservice.service.AuthClient;
import com.eventiq.eventservice.service.EventDomainService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/events")
public class EventController {
    private final EventDomainService eventService;
    private final AuthClient authClient;

    public EventController(EventDomainService eventService, AuthClient authClient) {
        this.eventService = eventService;
        this.authClient = authClient;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event createEvent(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody CreateEventRequest request
    ) {
        Map<String, Object> profile = authClient.fetchProfile(authorization);
        String role = String.valueOf(profile.get("role"));
        if (!("organizer".equals(role) || "admin".equals(role))) {
            throw new IllegalArgumentException("Only organizer or admin can create events");
        }
        return eventService.create(request, String.valueOf(profile.get("id")));
    }

    @GetMapping
    public List<Event> listEvents() {
        return eventService.list();
    }

    @GetMapping("/{id}")
    public Event getEvent(@PathVariable String id) {
        return eventService.getById(id);
    }

    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        authClient.fetchProfile(authorization);
        return eventService.update(id, request);
    }

    @PostMapping("/{id}/register")
    public Event register(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization
    ) {
        Map<String, Object> profile = authClient.fetchProfile(authorization);
        return eventService.register(id, String.valueOf(profile.get("id")));
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "event");
    }
}
