package com.smartpark.bootstrap;

import com.smartpark.config.SmartParkProperties;
import com.smartpark.model.ParkingSession;
import com.smartpark.model.ParkingSlot;
import com.smartpark.model.SlotStatus;
import com.smartpark.model.SlotType;
import com.smartpark.model.UserAccount;
import com.smartpark.repository.ParkingSessionRepository;
import com.smartpark.repository.ParkingSlotRepository;
import com.smartpark.repository.UserAccountRepository;
import com.smartpark.service.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Seeds a believable demo dataset on first run: an admin operator, a 3-floor
 * lot with a realistic slot mix, seven days of historical sessions for the
 * analytics charts, and a starting live occupancy of ~40%.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final int FLOORS = 3;
    private static final int COLS = 8;
    private static final int ROWS = 5;
    private static final String[] STATE_CODES = {"DL", "HR", "PB", "UP", "MH", "KA", "TN", "CH"};

    private final UserAccountRepository users;
    private final ParkingSlotRepository slots;
    private final ParkingSessionRepository sessions;
    private final SessionService sessionService;
    private final PasswordEncoder passwordEncoder;
    private final SmartParkProperties props;

    public DataSeeder(UserAccountRepository users,
                      ParkingSlotRepository slots,
                      ParkingSessionRepository sessions,
                      SessionService sessionService,
                      PasswordEncoder passwordEncoder,
                      SmartParkProperties props) {
        this.users = users;
        this.slots = slots;
        this.sessions = sessions;
        this.sessionService = sessionService;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.getSeed().isEnabled()) {
            return;
        }
        seedAdmin();
        if (slots.count() == 0) {
            seedSlots();
            seedHistory();
            seedLiveOccupancy();
            log.info("SmartPark demo data seeded: {} slots, {} sessions.",
                    slots.count(), sessions.count());
        }
    }

    private void seedAdmin() {
        String username = props.getSeed().getAdminUsername();
        if (!users.existsByUsername(username)) {
            users.save(UserAccount.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(props.getSeed().getAdminPassword()))
                    .role("ROLE_ADMIN")
                    .displayName("Operations Admin")
                    .build());
            log.info("Seeded admin user '{}'.", username);
        }
    }

    private void seedSlots() {
        List<ParkingSlot> batch = new ArrayList<>();
        for (int floor = 1; floor <= FLOORS; floor++) {
            for (int row = 0; row < ROWS; row++) {
                for (int col = 0; col < COLS; col++) {
                    int index = row * COLS + col + 1;
                    String zone = col < COLS / 2 ? "A" : "B";
                    String code = String.format("L%d-%s%02d", floor, zone, index);
                    SlotType type = pickType(floor, index);
                    batch.add(ParkingSlot.builder()
                            .code(code)
                            .floor(floor)
                            .zone(zone)
                            .type(type)
                            .status(SlotStatus.FREE)
                            .x(col)
                            .y(row)
                            .sensorId("SN-" + code)
                            .lastChangedAt(Instant.now())
                            .build());
                }
            }
        }
        slots.saveAll(batch);
    }

    /** A realistic mix: mostly cars, with bike/EV/handicap/truck sprinkled in. */
    private SlotType pickType(int floor, int index) {
        if (index % 20 == 0) return SlotType.HANDICAP;
        if (index % 9 == 0) return SlotType.EV;
        if (floor == 1 && index % 7 == 0) return SlotType.BIKE;
        if (floor == FLOORS && index % 17 == 0) return SlotType.TRUCK;
        return SlotType.CAR;
    }

    /** Completed sessions spread across the last 7 days for the charts. */
    private void seedHistory() {
        List<ParkingSlot> all = slots.findAll();
        List<ParkingSession> history = new ArrayList<>();
        var rnd = ThreadLocalRandom.current();

        for (int daysAgo = 7; daysAgo >= 1; daysAgo--) {
            int count = rnd.nextInt(18, 34);
            for (int i = 0; i < count; i++) {
                ParkingSlot slot = all.get(rnd.nextInt(all.size()));
                // Entry somewhere during that day's active hours.
                Instant dayBase = Instant.now().minus(Duration.ofDays(daysAgo));
                Instant entry = dayBase.plusSeconds(rnd.nextInt(7 * 3600, 21 * 3600));
                long stayMinutes = rnd.nextInt(20, 6 * 60);
                Instant exit = entry.plus(Duration.ofMinutes(stayMinutes));
                double amount = sessionService.computeFee(entry, exit, slot.getType());
                history.add(ParkingSession.builder()
                        .slotId(slot.getId())
                        .slotCode(slot.getCode())
                        .plate(randomPlate())
                        .vehicleType(slot.getType())
                        .entryTime(entry)
                        .exitTime(exit)
                        .amount(amount)
                        .currency(props.getBilling().getCurrency())
                        .status(ParkingSession.Status.COMPLETED)
                        .build());
            }
        }
        sessions.saveAll(history);
    }

    /** Occupy ~40% of bays with live sessions started in the last couple of hours. */
    private void seedLiveOccupancy() {
        List<ParkingSlot> all = slots.findAll();
        var rnd = ThreadLocalRandom.current();
        List<ParkingSession> live = new ArrayList<>();
        for (ParkingSlot slot : all) {
            if (rnd.nextDouble() < 0.40) {
                String plate = randomPlate();
                Instant entry = Instant.now().minusSeconds(rnd.nextInt(300, 2 * 3600));
                slot.setStatus(SlotStatus.OCCUPIED);
                slot.setCurrentPlate(plate);
                slot.setLastChangedAt(entry);
                live.add(ParkingSession.builder()
                        .slotId(slot.getId())
                        .slotCode(slot.getCode())
                        .plate(plate)
                        .vehicleType(slot.getType())
                        .entryTime(entry)
                        .status(ParkingSession.Status.ACTIVE)
                        .currency(props.getBilling().getCurrency())
                        .build());
            }
        }
        slots.saveAll(all);
        sessions.saveAll(live);
    }

    private String randomPlate() {
        var rnd = ThreadLocalRandom.current();
        String state = STATE_CODES[rnd.nextInt(STATE_CODES.length)];
        char l1 = (char) ('A' + rnd.nextInt(26));
        char l2 = (char) ('A' + rnd.nextInt(26));
        return String.format("%s%02d%c%c%04d", state, rnd.nextInt(1, 99), l1, l2, rnd.nextInt(1, 9999));
    }
}
