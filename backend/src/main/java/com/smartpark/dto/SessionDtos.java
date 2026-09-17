package com.smartpark.dto;

import jakarta.validation.constraints.NotBlank;

/** Gate entry/exit payloads. */
public final class SessionDtos {

    private SessionDtos() {}

    /** Check a vehicle in. If {@code slotId} is null the service auto-assigns the nearest free bay. */
    public record CheckInRequest(
            @NotBlank String plate,
            String slotId) {}

    public record CheckOutRequest(
            @NotBlank String plate) {}
}
