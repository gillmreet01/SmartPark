package com.smartpark.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A single parking bay monitored by an IoT occupancy sensor.
 * The {@code x}/{@code y} coordinates position the bay on the live floor map.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "slots")
public class ParkingSlot {

    @Id
    private String id;

    /** Human-readable code, e.g. "L1-A07". */
    @Indexed(unique = true)
    private String code;

    private int floor;
    private String zone;

    private SlotType type;
    private SlotStatus status;

    /** Grid position on the floor map (column, row). */
    private int x;
    private int y;

    /** Plate of the vehicle currently occupying the bay, if any. */
    private String currentPlate;

    /** Id of the device/sensor bound to this bay. */
    private String sensorId;

    private Instant lastChangedAt;
}
