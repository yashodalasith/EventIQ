package com.eventiq.eventservice.repository;

import com.eventiq.eventservice.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EventRepository extends MongoRepository<Event, String> {
}
