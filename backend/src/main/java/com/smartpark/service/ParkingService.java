package com.smartpark.service;

import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import com.smartpark.repository.ParkingSlotRepository;
import com.smartpark.web.ApiException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Read + administration operations over parking bays. */
@Service
public class ParkingService {

    private final ParkingSlotRepository slots;
    private final SlotStateService slotState;

    public ParkingService(ParkingSlotRepository slots, SlotStateService slotState) {
        this.slots = slots;
        this.slotState = slotState;
    }

    public List<ParkingSlot> listAll() {
        return slots.findAll().stream()
                .sorted(Comparator.comparingInt(ParkingSlot::getFloor)
                        .thenComparing(ParkingSlot::getCode))
                .toList();
    }

    public List<ParkingSlot> listByFloor(int floor) {
        return slots.findByFloorOrderByZoneAscCodeAsc(floor);
    }

    public ParkingSlot get(String id) {
        return slots.findById(id)
                .orElseThrow(() -> ApiException.notFound("Slot not found: " + id));
    }

    public ParkingSlot updateStatus(String id, SlotStatus status) {
        ParkingSlot slot = get(id);
        return slotState.setStatus(slot, status);
    }

    public ParkingSlot updateType(String id, SlotType type) {
        ParkingSlot slot = get(id);
        slot.setType(type);
        return slots.save(slot);
    }

    /** Pick the first FREE bay, preferring a matching type, else any type. */
    public Optional<ParkingSlot> findFreeSlot(SlotType preferredType) {
        List<ParkingSlot> free = slots.findByStatus(SlotStatus.FREE);
        return free.stream()
                .filter(s -> preferredType == null || s.getType() == preferredType)
                .min(Comparator.comparingInt(ParkingSlot::getFloor)
                        .thenComparing(ParkingSlot::getCode))
                .or(() -> free.stream()
                        .min(Comparator.comparingInt(ParkingSlot::getFloor)
                                .thenComparing(ParkingSlot::getCode)));
    }
}
