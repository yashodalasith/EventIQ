package com.eventiq.eventservice.repository;

import com.eventiq.eventservice.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface EventRepository extends MongoRepository<Event, String> {
	List<Event> findByOrganizerId(String organizerId);
}
