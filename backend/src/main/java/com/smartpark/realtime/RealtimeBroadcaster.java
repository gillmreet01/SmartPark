package com.smartpark.realtime;

import com.smartpark.dto.StatsDtos;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SensorEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/** Thin wrapper around STOMP messaging used across services to push live updates. */
@Component
public class RealtimeBroadcaster {

    private final SimpMessagingTemplate messaging;

    public RealtimeBroadcaster(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    public void slotChanged(ParkingSlot slot) {
        messaging.convertAndSend("/topic/slots", slot);
    }

    public void sensorEvent(SensorEvent event) {
        messaging.convertAndSend("/topic/events", event);
    }

    public void stats(StatsDtos.DashboardStats stats) {
        messaging.convertAndSend("/topic/stats", stats);
    }
}
