package com.smartpark.repository;

import com.smartpark.model.SensorEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface SensorEventRepository extends MongoRepository<SensorEvent, String> {

    List<SensorEvent> findTop50ByOrderByTimestampDesc();

    List<SensorEvent> findByTimestampBetween(Instant from, Instant to);
}
