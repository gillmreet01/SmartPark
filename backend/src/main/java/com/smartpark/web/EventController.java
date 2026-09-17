package com.smartpark.web;

import com.smartpark.model.SensorEvent;
import com.smartpark.repository.SensorEventRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final SensorEventRepository events;

    public EventController(SensorEventRepository events) {
        this.events = events;
    }

    @GetMapping("/recent")
    public List<SensorEvent> recent() {
        return events.findTop50ByOrderByTimestampDesc();
    }
}
