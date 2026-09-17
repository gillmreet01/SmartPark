package com.smartpark.service;

import com.smartpark.dto.ReservationDtos;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.Reservation;
import com.smartpark.model.SlotStatus;
import com.smartpark.repository.ReservationRepository;
import com.smartpark.web.ApiException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/** Booking a specific bay for a time window. */
@Service
public class ReservationService {

    private final ReservationRepository reservations;
    private final ParkingService parkingService;
    private final SlotStateService slotState;

    public ReservationService(ReservationRepository reservations,
                              ParkingService parkingService,
                              SlotStateService slotState) {
        this.reservations = reservations;
        this.parkingService = parkingService;
        this.slotState = slotState;
    }

    public List<Reservation> listAll() {
        return reservations.findAllByOrderByCreatedAtDesc();
    }

    public Reservation create(ReservationDtos.CreateRequest req) {
        if (req.toTime().isBefore(req.fromTime())) {
            throw ApiException.badRequest("Reservation end must be after start");
        }
        ParkingSlot slot = parkingService.get(req.slotId());
        if (slot.getStatus() == SlotStatus.OCCUPIED) {
            throw ApiException.conflict("Slot " + slot.getCode() + " is currently occupied");
        }

        boolean overlaps = reservations
                .findBySlotIdAndStatusIn(slot.getId(),
                        List.of(Reservation.Status.PENDING, Reservation.Status.ACTIVE))
                .stream()
                .anyMatch(r -> r.getFromTime().isBefore(req.toTime())
                        && req.fromTime().isBefore(r.getToTime()));
        if (overlaps) {
            throw ApiException.conflict("Slot " + slot.getCode() + " already booked for that window");
        }

        Reservation reservation = Reservation.builder()
                .slotId(slot.getId())
                .slotCode(slot.getCode())
                .plate(req.plate().trim().toUpperCase())
                .customerName(req.customerName())
                .fromTime(req.fromTime())
                .toTime(req.toTime())
                .status(Reservation.Status.ACTIVE)
                .createdAt(Instant.now())
                .build();

        // Hold the bay so it isn't handed to a walk-in.
        if (slot.getStatus() == SlotStatus.FREE) {
            slotState.setStatus(slot, SlotStatus.RESERVED);
        }
        return reservations.save(reservation);
    }

    public Reservation cancel(String id) {
        Reservation reservation = reservations.findById(id)
                .orElseThrow(() -> ApiException.notFound("Reservation not found: " + id));
        reservation.setStatus(Reservation.Status.CANCELLED);
        Reservation saved = reservations.save(reservation);
        releaseHoldIfIdle(reservation);
        return saved;
    }

    /** Free the bay's RESERVED hold when no other active booking needs it. */
    private void releaseHoldIfIdle(Reservation reservation) {
        ParkingSlot slot = parkingService.get(reservation.getSlotId());
        if (slot.getStatus() != SlotStatus.RESERVED) {
            return;
        }
        boolean stillHeld = reservations
                .findBySlotIdAndStatusIn(slot.getId(),
                        List.of(Reservation.Status.PENDING, Reservation.Status.ACTIVE))
                .stream()
                .anyMatch(r -> !r.getId().equals(reservation.getId()));
        if (!stillHeld) {
            slotState.setStatus(slot, SlotStatus.FREE);
        }
    }
}
