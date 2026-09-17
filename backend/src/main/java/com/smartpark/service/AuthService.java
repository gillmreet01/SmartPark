package com.smartpark.service;

import com.smartpark.dto.AuthDtos;
import com.smartpark.model.UserAccount;
import com.smartpark.repository.UserAccountRepository;
import com.smartpark.security.JwtService;
import com.smartpark.web.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Username/password sign-in that mints a JWT. */
@Service
public class AuthService {

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository users,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest req) {
        UserAccount user = users.findByUsername(req.username().trim())
                .orElseThrow(() -> new ApiException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.issue(user.getUsername(), user.getRole());
        return new AuthDtos.LoginResponse(token, user.getUsername(),
                user.getDisplayName(), user.getRole(), jwtService.getExpirationSeconds());
    }
}
