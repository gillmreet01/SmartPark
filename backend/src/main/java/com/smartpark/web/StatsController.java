package com.smartpark.web;

import com.smartpark.dto.StatsDtos;
import com.smartpark.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/dashboard")
    public StatsDtos.DashboardStats dashboard() {
        return statsService.dashboard();
    }

    @GetMapping("/analytics")
    public StatsDtos.Analytics analytics() {
        return statsService.analytics();
    }
}
