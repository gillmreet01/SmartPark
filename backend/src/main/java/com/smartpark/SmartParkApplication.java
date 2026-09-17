package com.smartpark;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SmartPark — IoT-Based Smart Parking Management System.
 *
 * <p>Entry point for the Spring Boot service that exposes the REST API, streams
 * live slot/sensor updates over WebSocket (STOMP), and runs the IoT device
 * simulator that mimics real parking-bay occupancy sensors.
 */
@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class SmartParkApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartParkApplication.class, args);
    }
}
