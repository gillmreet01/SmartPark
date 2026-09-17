package com.smartpark.web;

import com.smartpark.dto.AuthDtos;
import com.smartpark.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Not signed in");
        }
        return Map.of(
                "username", auth.getName(),
                "authorities", auth.getAuthorities());
    }
}
