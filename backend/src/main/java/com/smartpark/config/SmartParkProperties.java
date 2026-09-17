package com.smartpark.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Strongly-typed binding for the {@code smartpark.*} configuration tree. */
@Data
@ConfigurationProperties(prefix = "smartpark")
public class SmartParkProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Simulator simulator = new Simulator();
    private Billing billing = new Billing();
    private Seed seed = new Seed();

    @Data
    public static class Jwt {
        private String secret;
        private long expirationMinutes = 720;
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";
    }

    @Data
    public static class Simulator {
        private boolean enabled = true;
        private long intervalMs = 3500;
    }

    @Data
    public static class Billing {
        private String currency = "INR";
        private double ratePerHour = 40.0;
        private double evSurchargePerHour = 15.0;
    }

    @Data
    public static class Seed {
        private boolean enabled = true;
        private String adminUsername = "admin";
        private String adminPassword = "admin123";
    }
}
