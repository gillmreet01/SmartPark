package com.smartpark.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** A vehicle's stay in a bay, from gate entry to exit, with the computed fee. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sessions")
public class ParkingSession {

    public enum Status { ACTIVE, COMPLETED }

    @Id
    private String id;

    private String slotId;
    private String slotCode;

    @Indexed
    private String plate;

    private SlotType vehicleType;

    private Instant entryTime;
    private Instant exitTime;

    /** Billed amount once the session is completed. */
    private Double amount;
    private String currency;

    private Status status;
}
