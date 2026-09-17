package com.smartpark.dto;

import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import jakarta.validation.constraints.NotNull;

/** Slot administration payloads. */
public final class SlotDtos {

    private SlotDtos() {}

    public record UpdateStatusRequest(
            @NotNull SlotStatus status) {}

    public record UpdateTypeRequest(
            @NotNull SlotType type) {}
}
