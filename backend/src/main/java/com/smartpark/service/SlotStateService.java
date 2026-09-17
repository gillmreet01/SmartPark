package com.smartpark.service;

import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SensorEvent;
import com.smartpark.model.SlotStatus;
import com.smartpark.realtime.RealtimeBroadcaster;
import com.smartpark.repository.ParkingSlotRepository;
import com.smartpark.repository.SensorEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Single source of truth for changing a bay's occupancy. Every transition also
 * writes the matching IoT sensor event and pushes both the slot and the event
 * to subscribed clients, so the simulator, the gate flow, and admin overrides
 * all behave identically.
 */
@Service
public class SlotStateService {

    private final ParkingSlotRepository slots;
    private final SensorEventRepository events;
    private final RealtimeBroadcaster broadcaster;

    public SlotStateService(ParkingSlotRepository slots,
                            SensorEventRepository events,
                            RealtimeBroadcaster broadcaster) {
        this.slots = slots;
        this.events = events;
        this.broadcaster = broadcaster;
    }

    /** Mark a bay occupied by a vehicle and emit an OCCUPIED sensor reading. */
    public ParkingSlot occupy(ParkingSlot slot, String plate, double confidence) {
        slot.setStatus(SlotStatus.OCCUPIED);
        slot.setCurrentPlate(plate);
        slot.setLastChangedAt(Instant.now());
        ParkingSlot saved = slots.save(slot);
        emit(saved, SensorEvent.Type.OCCUPIED, true, confidence);
        broadcaster.slotChanged(saved);
        return saved;
    }

    /** Free a bay and emit a VACATED sensor reading. */
    public ParkingSlot vacate(ParkingSlot slot, double confidence) {
        slot.setStatus(SlotStatus.FREE);
        slot.setCurrentPlate(null);
        slot.setLastChangedAt(Instant.now());
        ParkingSlot saved = slots.save(slot);
        emit(saved, SensorEvent.Type.VACATED, false, confidence);
        broadcaster.slotChanged(saved);
        return saved;
    }

    /** Administrative status override (e.g. RESERVED, OUT_OF_SERVICE). */
    public ParkingSlot setStatus(ParkingSlot slot, SlotStatus status) {
        slot.setStatus(status);
        if (status != SlotStatus.OCCUPIED) {
            slot.setCurrentPlate(null);
        }
        slot.setLastChangedAt(Instant.now());
        ParkingSlot saved = slots.save(slot);
        if (status == SlotStatus.OUT_OF_SERVICE) {
            emit(saved, SensorEvent.Type.FAULT, false, 0.5);
        }
        broadcaster.slotChanged(saved);
        return saved;
    }

    public void heartbeat(ParkingSlot slot) {
        emit(slot, SensorEvent.Type.HEARTBEAT, slot.getStatus() == SlotStatus.OCCUPIED, 0.99);
    }

    private void emit(ParkingSlot slot, SensorEvent.Type type, boolean occupied, double confidence) {
        SensorEvent event = SensorEvent.builder()
                .sensorId(slot.getSensorId())
                .slotId(slot.getId())
                .slotCode(slot.getCode())
                .type(type)
                .occupied(occupied)
                .confidence(Math.round(confidence * 100.0) / 100.0)
                .timestamp(Instant.now())
                .build();
        events.save(event);
        broadcaster.sensorEvent(event);
    }
}
