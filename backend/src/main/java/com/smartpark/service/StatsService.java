package com.smartpark.service;

import com.smartpark.config.SmartParkProperties;
import com.smartpark.dto.StatsDtos;
import com.smartpark.model.ParkingSession;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import com.smartpark.repository.ParkingSessionRepository;
import com.smartpark.repository.ParkingSlotRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Aggregates live counters and historical time-series for the dashboard. */
@Service
public class StatsService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd MMM");

    private final ParkingSlotRepository slots;
    private final ParkingSessionRepository sessions;
    private final SmartParkProperties props;
    private final ZoneId zone = ZoneId.systemDefault();

    public StatsService(ParkingSlotRepository slots,
                        ParkingSessionRepository sessions,
                        SmartParkProperties props) {
        this.slots = slots;
        this.sessions = sessions;
        this.props = props;
    }

    public StatsDtos.DashboardStats dashboard() {
        long total = slots.count();
        long occupied = slots.countByStatus(SlotStatus.OCCUPIED);
        long free = slots.countByStatus(SlotStatus.FREE);
        long reserved = slots.countByStatus(SlotStatus.RESERVED);
        long oos = slots.countByStatus(SlotStatus.OUT_OF_SERVICE);
        double occupancyRate = total == 0 ? 0 : round1(occupied * 100.0 / total);

        Instant startOfDay = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant now = Instant.now();
        List<ParkingSession> completedToday = sessions.findByExitTimeBetween(startOfDay, now);
        double revenueToday = round2(completedToday.stream()
                .filter(s -> s.getAmount() != null)
                .mapToDouble(ParkingSession::getAmount).sum());
        long vehiclesToday = sessions.countByEntryTimeBetween(startOfDay, now);
        long active = sessions.findByStatusOrderByEntryTimeDesc(ParkingSession.Status.ACTIVE).size();

        Map<String, Long> byType = new LinkedHashMap<>();
        for (SlotType type : SlotType.values()) {
            long count = slots.countByType(type);
            if (count > 0) {
                byType.put(type.name(), count);
            }
        }

        Map<Integer, List<ParkingSlot>> byFloor = slots.findAll().stream()
                .collect(Collectors.groupingBy(ParkingSlot::getFloor));
        List<StatsDtos.FloorSummary> floors = byFloor.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    long floorTotal = e.getValue().size();
                    long floorOccupied = e.getValue().stream()
                            .filter(s -> s.getStatus() == SlotStatus.OCCUPIED).count();
                    double rate = floorTotal == 0 ? 0 : round1(floorOccupied * 100.0 / floorTotal);
                    return new StatsDtos.FloorSummary(e.getKey(), floorTotal, floorOccupied, rate);
                })
                .toList();

        return new StatsDtos.DashboardStats(total, occupied, free, reserved, oos,
                occupancyRate, active, revenueToday, vehiclesToday,
                props.getBilling().getCurrency(), byType, floors);
    }

    public StatsDtos.Analytics analytics() {
        List<ParkingSession> all = sessions.findAll();

        // Hourly demand curve over the last 24 hours (entries per hour).
        List<StatsDtos.TimePoint> byHour = new ArrayList<>();
        Instant now = Instant.now();
        for (int h = 23; h >= 0; h--) {
            Instant bucketStart = now.minusSeconds((h + 1L) * 3600);
            Instant bucketEnd = now.minusSeconds(h * 3600L);
            long count = all.stream()
                    .filter(s -> s.getEntryTime() != null)
                    .filter(s -> !s.getEntryTime().isBefore(bucketStart) && s.getEntryTime().isBefore(bucketEnd))
                    .count();
            String label = bucketEnd.atZone(zone).getHour() + ":00";
            byHour.add(new StatsDtos.TimePoint(label, count));
        }

        // Revenue + vehicles for each of the last 7 days.
        List<StatsDtos.TimePoint> revenueByDay = new ArrayList<>();
        List<StatsDtos.TimePoint> vehiclesByDay = new ArrayList<>();
        for (int d = 6; d >= 0; d--) {
            LocalDate day = LocalDate.now(zone).minusDays(d);
            Instant dayStart = day.atStartOfDay(zone).toInstant();
            Instant dayEnd = day.plusDays(1).atStartOfDay(zone).toInstant();
            double revenue = all.stream()
                    .filter(s -> s.getExitTime() != null && s.getAmount() != null)
                    .filter(s -> !s.getExitTime().isBefore(dayStart) && s.getExitTime().isBefore(dayEnd))
                    .mapToDouble(ParkingSession::getAmount).sum();
            long vehicles = all.stream()
                    .filter(s -> s.getEntryTime() != null)
                    .filter(s -> !s.getEntryTime().isBefore(dayStart) && s.getEntryTime().isBefore(dayEnd))
                    .count();
            String label = day.format(DAY_LABEL);
            revenueByDay.add(new StatsDtos.TimePoint(label, round2(revenue)));
            vehiclesByDay.add(new StatsDtos.TimePoint(label, vehicles));
        }

        Map<String, Long> occupancyByType = slots.findByStatus(SlotStatus.OCCUPIED).stream()
                .collect(Collectors.groupingBy(s -> s.getType().name(),
                        LinkedHashMap::new, Collectors.counting()));

        List<ParkingSession> completed = all.stream()
                .filter(s -> s.getStatus() == ParkingSession.Status.COMPLETED
                        && s.getExitTime() != null && s.getAmount() != null)
                .toList();
        double avgDuration = completed.stream()
                .mapToLong(s -> java.time.Duration.between(s.getEntryTime(), s.getExitTime()).toMinutes())
                .average().orElse(0);
        double avgTicket = completed.stream()
                .mapToDouble(ParkingSession::getAmount).average().orElse(0);

        return new StatsDtos.Analytics(byHour, revenueByDay, vehiclesByDay, occupancyByType,
                round1(avgDuration), round2(avgTicket), props.getBilling().getCurrency());
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
