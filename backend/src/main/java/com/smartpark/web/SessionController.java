package com.smartpark.web;

import com.smartpark.dto.SessionDtos;
import com.smartpark.model.ParkingSession;
import com.smartpark.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/active")
    public List<ParkingSession> active() {
        return sessionService.activeSessions();
    }

    @GetMapping("/recent")
    public List<ParkingSession> recent() {
        return sessionService.recent();
    }

    @PostMapping("/checkin")
    public ParkingSession checkIn(@Valid @RequestBody SessionDtos.CheckInRequest req) {
        return sessionService.checkIn(req.plate(), req.slotId());
    }

    @PostMapping("/checkout")
    public ParkingSession checkOut(@Valid @RequestBody SessionDtos.CheckOutRequest req) {
        return sessionService.checkOut(req.plate());
    }
}
