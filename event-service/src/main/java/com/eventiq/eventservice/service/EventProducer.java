package com.eventiq.eventservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EventProducer {
    private static final Logger log = LoggerFactory.getLogger(EventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String eventCreatedTopic;
    private final String eventRegistrationTopic;

    public EventProducer(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.kafka.topics.event-created:event-created}") String eventCreatedTopic,
            @Value("${app.kafka.topics.event-registration:event-registration}") String eventRegistrationTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.eventCreatedTopic = eventCreatedTopic;
        this.eventRegistrationTopic = eventRegistrationTopic;
    }

    public void publishEventCreated(Map<String, Object> payload) {
        publish(eventCreatedTopic, payload);
    }

    public void publishEventRegistration(Map<String, Object> payload) {
        publish(eventRegistrationTopic, payload);
    }

    private void publish(String topic, Map<String, Object> payload) {
        kafkaTemplate.send(topic, payload).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Kafka publish failed for topic={}", topic, ex);
                return;
            }

            if (result != null && result.getRecordMetadata() != null) {
                log.info("Kafka publish success topic={} partition={} offset={}",
                        topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
