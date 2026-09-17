package com.smartpark.service;

import com.smartpark.config.SmartParkProperties;
import com.smartpark.model.ParkingSession;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.realtime.RealtimeBroadcaster;
import com.smartpark.repository.ParkingSessionRepository;
import com.smartpark.repository.ParkingSlotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * IoT device simulator.
 *
 * <p>Stands in for real occupancy sensors: on each tick it decides whether a
 * vehicle arrives or leaves — biased by current occupancy so the lot breathes
 * between roughly 30% and 85% full — and drives the same gate flow a physical
 * sensor would. In production this class would be replaced by an MQTT listener
 * consuming readings from ESP32/ultrasonic sensors; nothing else changes.
 */
@Service
public class SimulatorService {

    private static final Logger log = LoggerFactory.getLogger(SimulatorService.class);
    private static final String[] STATE_CODES = {"DL", "HR", "PB", "UP", "MH", "KA", "TN", "CH"};

    private final SessionService sessionService;
    private final ParkingSlotRepository slots;
    private final ParkingSessionRepository sessions;
    private final SlotStateService slotState;
    private final StatsService statsService;
    private final RealtimeBroadcaster broadcaster;
    private final SmartParkProperties props;

    public SimulatorService(SessionService sessionService,
                            ParkingSlotRepository slots,
                            ParkingSessionRepository sessions,
                            SlotStateService slotState,
                            StatsService statsService,
                            RealtimeBroadcaster broadcaster,
                            SmartParkProperties props) {
        this.sessionService = sessionService;
        this.slots = slots;
        this.sessions = sessions;
        this.slotState = slotState;
        this.statsService = statsService;
        this.broadcaster = broadcaster;
        this.props = props;
    }

    @Scheduled(fixedDelayString = "${smartpark.simulator.interval-ms:3500}",
               initialDelay = 4000)
    public void tick() {
        if (!props.getSimulator().isEnabled()) {
            return;
        }
        try {
            long total = slots.count();
            if (total == 0) {
                return;
            }
            long occupied = slots.countByStatus(SlotStatus.OCCUPIED);
            double ratio = (double) occupied / total;

            // Bias arrivals when quiet, departures when busy.
            double arriveProbability = ratio < 0.30 ? 0.85 : ratio > 0.85 ? 0.15 : 0.55;
            boolean arrive = ThreadLocalRandom.current().nextDouble() < arriveProbability;

            if (arrive) {
                simulateArrival();
            } else {
                simulateDeparture();
            }

            // Occasional sensor heartbeat for realism.
            if (ThreadLocalRandom.current().nextDouble() < 0.15) {
                slots.findByStatus(SlotStatus.FREE).stream().findAny()
                        .ifPresent(slotState::heartbeat);
            }
        } catch (Exception ex) {
            log.debug("Simulator tick skipped: {}", ex.getMessage());
        } finally {
            broadcaster.stats(statsService.dashboard());
        }
    }

    private void simulateArrival() {
        List<ParkingSlot> free = slots.findByStatus(SlotStatus.FREE);
        if (free.isEmpty()) {
            return;
        }
        ParkingSlot target = free.get(ThreadLocalRandom.current().nextInt(free.size()));
        try {
            sessionService.checkIn(randomPlate(), target.getId());
        } catch (Exception ignored) {
            // Slot taken between read and write; try again next tick.
        }
    }

    private void simulateDeparture() {
        List<ParkingSession> active =
                sessions.findByStatusOrderByEntryTimeDesc(ParkingSession.Status.ACTIVE);
        if (active.isEmpty()) {
            return;
        }
        ParkingSession leaving = active.get(ThreadLocalRandom.current().nextInt(active.size()));
        try {
            sessionService.checkOut(leaving.getPlate());
        } catch (Exception ignored) {
            // Already checked out; ignore.
        }
    }

    private String randomPlate() {
        var rnd = ThreadLocalRandom.current();
        String state = STATE_CODES[rnd.nextInt(STATE_CODES.length)];
        char l1 = (char) ('A' + rnd.nextInt(26));
        char l2 = (char) ('A' + rnd.nextInt(26));
        return String.format("%s%02d%c%c%04d", state, rnd.nextInt(1, 99), l1, l2, rnd.nextInt(1, 9999));
    }
}
