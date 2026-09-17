package com.smartpark.dto;

import java.util.List;
import java.util.Map;

/** Analytics + dashboard read models. */
public final class StatsDtos {

    private StatsDtos() {}

    public record DashboardStats(
            long totalSlots,
            long occupied,
            long free,
            long reserved,
            long outOfService,
            double occupancyRate,
            long activeSessions,
            double revenueToday,
            long vehiclesToday,
            String currency,
            Map<String, Long> byType,
            List<FloorSummary> floors) {}

    public record FloorSummary(
            int floor,
            long total,
            long occupied,
            double occupancyRate) {}

    /** A single point in a time series (bucket label + value). */
    public record TimePoint(
            String label,
            double value) {}

    public record Analytics(
            List<TimePoint> occupancyByHour,
            List<TimePoint> revenueByDay,
            List<TimePoint> vehiclesByDay,
            Map<String, Long> occupancyByType,
            double avgDurationMinutes,
            double avgTicket,
            String currency) {}
}
