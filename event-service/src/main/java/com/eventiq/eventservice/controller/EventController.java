package com.eventiq.eventservice.controller;

import com.eventiq.eventservice.dto.CreateEventRequest;
import com.eventiq.eventservice.dto.UpdateEventRequest;
import com.eventiq.eventservice.exception.ForbiddenException;
import com.eventiq.eventservice.model.Event;
import com.eventiq.eventservice.security.UserProfile;
import com.eventiq.eventservice.service.AuthClient;
import com.eventiq.eventservice.service.EventDomainService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        UserProfile profile = authClient.fetchProfile(authorization);
        String role = profile.role();
        if (!("organizer".equals(role) || "admin".equals(role))) {
            throw new ForbiddenException("Only organizer or admin can create events");
        }
        return eventService.create(request, profile);
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
        UserProfile profile = authClient.fetchProfile(authorization);
        return eventService.update(id, request, profile);
    }

    @PostMapping("/{id}/register")
    public Event register(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization
    ) {
        UserProfile profile = authClient.fetchProfile(authorization);
        return eventService.register(id, profile);
    }

    @GetMapping("/mine")
    public List<Event> listMyEvents(@RequestHeader("Authorization") String authorization) {
        UserProfile profile = authClient.fetchProfile(authorization);
        if (!("organizer".equals(profile.role()) || "admin".equals(profile.role()))) {
            throw new ForbiddenException("Only organizer or admin can view owned events");
        }
        return eventService.listMine(profile);
    }

    @PostMapping("/{id}/publish")
    public Event publishEvent(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization
    ) {
        UserProfile profile = authClient.fetchProfile(authorization);
        return eventService.publishEvent(id, profile);
    }
}
