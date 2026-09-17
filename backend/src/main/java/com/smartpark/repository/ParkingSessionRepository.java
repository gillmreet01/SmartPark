package com.smartpark.repository;

import com.smartpark.model.ParkingSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ParkingSessionRepository extends MongoRepository<ParkingSession, String> {

    Optional<ParkingSession> findByPlateAndStatus(String plate, ParkingSession.Status status);

    Optional<ParkingSession> findBySlotIdAndStatus(String slotId, ParkingSession.Status status);

    List<ParkingSession> findByStatusOrderByEntryTimeDesc(ParkingSession.Status status);

    List<ParkingSession> findByExitTimeBetween(Instant from, Instant to);

    List<ParkingSession> findByEntryTimeBetween(Instant from, Instant to);

    long countByEntryTimeBetween(Instant from, Instant to);

    List<ParkingSession> findTop20ByOrderByEntryTimeDesc();
}
