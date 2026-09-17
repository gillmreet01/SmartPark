package com.smartpark.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A raw reading emitted by an IoT occupancy sensor. In a real deployment these
 * would arrive over MQTT from an ESP32/ultrasonic sensor; here the simulator
 * produces them. Persisted as an append-only event log for analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sensor_events")
public class SensorEvent {

    public enum Type { OCCUPIED, VACATED, HEARTBEAT, FAULT }

    @Id
    private String id;

    private String sensorId;
    private String slotId;
    private String slotCode;

    private Type type;
    private boolean occupied;

    /** Simulated sensor confidence 0..1. */
    private double confidence;

    @Indexed
    private Instant timestamp;
}
