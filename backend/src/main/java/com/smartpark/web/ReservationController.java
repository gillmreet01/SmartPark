package com.smartpark.web;

import com.smartpark.dto.ReservationDtos;
import com.smartpark.model.Reservation;
import com.smartpark.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public List<Reservation> all() {
        return reservationService.listAll();
    }

    @PostMapping
    public Reservation create(@Valid @RequestBody ReservationDtos.CreateRequest req) {
        return reservationService.create(req);
    }

    @PostMapping("/{id}/cancel")
    public Reservation cancel(@PathVariable String id) {
        return reservationService.cancel(id);
    }
}
