package com.smartpark.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

/** Reservation payloads. */
public final class ReservationDtos {

    private ReservationDtos() {}

    public record CreateRequest(
            @NotBlank String slotId,
            @NotBlank String plate,
            String customerName,
            @NotNull Instant fromTime,
            @NotNull Instant toTime) {}
}
