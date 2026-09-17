package com.smartpark.web;

import com.smartpark.dto.SlotDtos;
import com.smartpark.model.ParkingSlot;
import com.smartpark.service.ParkingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final ParkingService parkingService;

    public SlotController(ParkingService parkingService) {
        this.parkingService = parkingService;
    }

    @GetMapping
    public List<ParkingSlot> all() {
        return parkingService.listAll();
    }

    @GetMapping("/floor/{floor}")
    public List<ParkingSlot> byFloor(@PathVariable int floor) {
        return parkingService.listByFloor(floor);
    }

    @GetMapping("/{id}")
    public ParkingSlot one(@PathVariable String id) {
        return parkingService.get(id);
    }

    @PatchMapping("/{id}/status")
    public ParkingSlot updateStatus(@PathVariable String id,
                                    @Valid @RequestBody SlotDtos.UpdateStatusRequest req) {
        return parkingService.updateStatus(id, req.status());
    }

    @PatchMapping("/{id}/type")
    public ParkingSlot updateType(@PathVariable String id,
                                  @Valid @RequestBody SlotDtos.UpdateTypeRequest req) {
        return parkingService.updateType(id, req.type());
    }
}
