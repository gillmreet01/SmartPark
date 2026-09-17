package com.smartpark.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** A booking that holds a specific bay for a window of time. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reservations")
public class Reservation {

    public enum Status { PENDING, ACTIVE, FULFILLED, CANCELLED, EXPIRED }

    @Id
    private String id;

    private String slotId;
    private String slotCode;

    @Indexed
    private String plate;
    private String customerName;

    private Instant fromTime;
    private Instant toTime;

    private Status status;
    private Instant createdAt;
}
