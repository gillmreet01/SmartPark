package com.smartpark.dto;

import jakarta.validation.constraints.NotBlank;

/** Authentication request/response payloads. */
public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password) {}

    public record LoginResponse(
            String token,
            String username,
            String displayName,
            String role,
            long expiresInSeconds) {}
}
