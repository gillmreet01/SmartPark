package com.smartpark.repository;

import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ParkingSlotRepository extends MongoRepository<ParkingSlot, String> {

    Optional<ParkingSlot> findByCode(String code);

    List<ParkingSlot> findByFloorOrderByZoneAscCodeAsc(int floor);

    List<ParkingSlot> findByStatus(SlotStatus status);

    long countByStatus(SlotStatus status);

    long countByType(SlotType type);

    long countByTypeAndStatus(SlotType type, SlotStatus status);
}
