package com.smartpark.service;

import com.smartpark.config.SmartParkProperties;
import com.smartpark.model.ParkingSession;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import com.smartpark.repository.ParkingSessionRepository;
import com.smartpark.repository.ParkingSlotRepository;
import com.smartpark.web.ApiException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Gate entry/exit flow with duration-based billing. */
@Service
public class SessionService {

    private final ParkingSessionRepository sessions;
    private final ParkingSlotRepository slots;
    private final ParkingService parkingService;
    private final SlotStateService slotState;
    private final SmartParkProperties props;

    public SessionService(ParkingSessionRepository sessions,
                          ParkingSlotRepository slots,
                          ParkingService parkingService,
                          SlotStateService slotState,
                          SmartParkProperties props) {
        this.sessions = sessions;
        this.slots = slots;
        this.parkingService = parkingService;
        this.slotState = slotState;
        this.props = props;
    }

    public List<ParkingSession> activeSessions() {
        return sessions.findByStatusOrderByEntryTimeDesc(ParkingSession.Status.ACTIVE);
    }

    public List<ParkingSession> recent() {
        return sessions.findTop20ByOrderByEntryTimeDesc();
    }

    /** Admit a vehicle. When {@code slotId} is null, the nearest free bay is auto-assigned. */
    public ParkingSession checkIn(String rawPlate, String slotId) {
        String plate = normalizePlate(rawPlate);

        sessions.findByPlateAndStatus(plate, ParkingSession.Status.ACTIVE).ifPresent(s -> {
            throw ApiException.conflict("Vehicle " + plate + " is already parked in " + s.getSlotCode());
        });

        ParkingSlot slot;
        if (slotId != null && !slotId.isBlank()) {
            slot = parkingService.get(slotId);
            if (slot.getStatus() == SlotStatus.OCCUPIED || slot.getStatus() == SlotStatus.OUT_OF_SERVICE) {
                throw ApiException.conflict("Slot " + slot.getCode() + " is not available");
            }
        } else {
            slot = parkingService.findFreeSlot(null)
                    .orElseThrow(() -> ApiException.conflict("Parking is full — no free bays"));
        }

        slotState.occupy(slot, plate, randomConfidence());

        ParkingSession session = ParkingSession.builder()
                .slotId(slot.getId())
                .slotCode(slot.getCode())
                .plate(plate)
                .vehicleType(slot.getType())
                .entryTime(Instant.now())
                .status(ParkingSession.Status.ACTIVE)
                .currency(props.getBilling().getCurrency())
                .build();
        return sessions.save(session);
    }

    /** Release a vehicle and bill for the stay. */
    public ParkingSession checkOut(String rawPlate) {
        String plate = normalizePlate(rawPlate);
        ParkingSession session = sessions.findByPlateAndStatus(plate, ParkingSession.Status.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active session for " + plate));

        Instant exit = Instant.now();
        session.setExitTime(exit);
        session.setAmount(computeFee(session.getEntryTime(), exit, session.getVehicleType()));
        session.setStatus(ParkingSession.Status.COMPLETED);
        ParkingSession saved = sessions.save(session);

        slots.findById(session.getSlotId())
                .ifPresent(slot -> slotState.vacate(slot, randomConfidence()));
        return saved;
    }

    /** Bill by the hour (rounded up), with an EV surcharge. */
    public double computeFee(Instant entry, Instant exit, SlotType type) {
        long minutes = Math.max(1, Duration.between(entry, exit).toMinutes());
        long hours = (long) Math.ceil(minutes / 60.0);
        double amount = hours * props.getBilling().getRatePerHour();
        if (type == SlotType.EV) {
            amount += hours * props.getBilling().getEvSurchargePerHour();
        }
        return Math.round(amount * 100.0) / 100.0;
    }

    private String normalizePlate(String plate) {
        if (plate == null || plate.isBlank()) {
            throw ApiException.badRequest("Plate is required");
        }
        return plate.trim().toUpperCase().replaceAll("\\s+", "");
    }

    private double randomConfidence() {
        return 0.9 + Math.random() * 0.1;
    }
}
