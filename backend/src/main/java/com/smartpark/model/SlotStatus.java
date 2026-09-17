package com.smartpark.model;

/** Live occupancy state of a parking bay, driven by IoT sensors. */
public enum SlotStatus {
    FREE,
    OCCUPIED,
    RESERVED,
    OUT_OF_SERVICE
}
