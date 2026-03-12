package com.eventiq.eventservice.service;

import com.eventiq.eventservice.dto.CreateEventRequest;
import com.eventiq.eventservice.dto.UpdateEventRequest;
import com.eventiq.eventservice.model.Event;
import com.eventiq.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EventDomainService {
    private final EventRepository eventRepository;
    private final EventProducer eventProducer;

    public EventDomainService(EventRepository eventRepository, EventProducer eventProducer) {
        this.eventRepository = eventRepository;
        this.eventProducer = eventProducer;
    }

    public Event create(CreateEventRequest request, String organizerId) {
        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setOrganizerId(organizerId);

        Event saved = eventRepository.save(event);

        Map<String, Object> message = new HashMap<>();
        message.put("eventId", saved.getId());
        message.put("organizerId", organizerId);
        message.put("title", saved.getTitle());
        eventProducer.publish("event-created", message);

        return saved;
    }

    public List<Event> list() {
        return eventRepository.findAll();
    }

    public Event getById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    public Event update(String id, UpdateEventRequest request) {
        Event event = getById(id);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        return eventRepository.save(event);
    }

    public Event register(String eventId, String participantId) {
        Event event = getById(eventId);
        if (!event.getParticipantIds().contains(participantId)) {
            event.getParticipantIds().add(participantId);
        }
        Event saved = eventRepository.save(event);

        Map<String, Object> message = new HashMap<>();
        message.put("eventId", saved.getId());
        message.put("participantId", participantId);
        message.put("title", saved.getTitle());
        eventProducer.publish("event-registration", message);

        return saved;
    }
}
