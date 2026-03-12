package com.eventiq.eventservice.service;

import com.eventiq.eventservice.dto.CreateEventRequest;
import com.eventiq.eventservice.dto.UpdateEventRequest;
import com.eventiq.eventservice.exception.BadRequestException;
import com.eventiq.eventservice.exception.ConflictException;
import com.eventiq.eventservice.exception.ForbiddenException;
import com.eventiq.eventservice.exception.NotFoundException;
import com.eventiq.eventservice.model.Event;
import com.eventiq.eventservice.repository.EventRepository;
import com.eventiq.eventservice.security.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EventDomainService {
    private static final Logger log = LoggerFactory.getLogger(EventDomainService.class);

    private final EventRepository eventRepository;
    private final EventProducer eventProducer;

    public EventDomainService(EventRepository eventRepository, EventProducer eventProducer) {
        this.eventRepository = eventRepository;
        this.eventProducer = eventProducer;
    }

    public Event create(CreateEventRequest request, UserProfile actor) {
        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setCapacity(request.getCapacity());
        event.setStatus("DRAFT");
        event.setEventDate(request.getEventDate());
        event.setOrganizerId(actor.id());

        Event saved = eventRepository.save(event);

        Map<String, Object> message = new HashMap<>();
        message.put("eventId", saved.getId());
        message.put("organizerId", actor.id());
        message.put("title", saved.getTitle());
        message.put("eventDate", saved.getEventDate().toString());
        eventProducer.publishEventCreated(message);

        log.info("event created eventId={} organizerId={}", saved.getId(), actor.id());

        return saved;
    }

    public List<Event> list() {
        return eventRepository.findAll();
    }

    public List<Event> listMine(UserProfile actor) {
        return eventRepository.findByOrganizerId(actor.id());
    }

    public Event getById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found"));
    }

    public Event update(String id, UpdateEventRequest request, UserProfile actor) {
        Event event = getById(id);

        boolean isAdmin = "admin".equals(actor.role());
        boolean isOwner = event.getOrganizerId().equals(actor.id());
        if (!(isAdmin || isOwner)) {
            throw new ForbiddenException("Only event owner or admin can update event");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setCapacity(request.getCapacity());
        event.setEventDate(request.getEventDate());

        return eventRepository.save(event);
    }

    public Event register(String eventId, UserProfile actor) {
        Event event = getById(eventId);

        if ("DRAFT".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Event is not published yet");
        }

        int capacity = event.getCapacity() == null ? Integer.MAX_VALUE : event.getCapacity();

        if (event.getParticipantIds().contains(actor.id())) {
            throw new ConflictException("User already registered for this event");
        }

        if (event.getParticipantIds().size() >= capacity) {
            throw new BadRequestException("Event capacity reached");
        }

        event.getParticipantIds().add(actor.id());
        Event saved = eventRepository.save(event);

        Map<String, Object> message = new HashMap<>();
        message.put("eventId", saved.getId());
        message.put("participantId", actor.id());
        message.put("participantEmail", actor.email());
        message.put("title", saved.getTitle());
        eventProducer.publishEventRegistration(message);

        log.info("event registered eventId={} participantId={}", saved.getId(), actor.id());

        return saved;
    }

    public Event publishEvent(String eventId, UserProfile actor) {
        Event event = getById(eventId);
        boolean isAdmin = "admin".equals(actor.role());
        boolean isOwner = event.getOrganizerId().equals(actor.id());
        if (!(isAdmin || isOwner)) {
            throw new ForbiddenException("Only event owner or admin can publish event");
        }

        event.setStatus("PUBLISHED");
        return eventRepository.save(event);
    }
}
