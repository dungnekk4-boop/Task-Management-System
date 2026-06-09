package com.example.Task_Management_System.config;

import com.example.Task_Management_System.entity.User;
import com.example.Task_Management_System.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.enabled:true}")
    private boolean adminSeedEnabled;

    @Value("${app.admin.name:System Admin}")
    private String adminName;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@12345}")
    private String adminPassword;

    public AdminAccountInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!adminSeedEnabled) {
            return;
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(existingAdmin -> {
            if (!"ADMIN".equals(existingAdmin.getRole())) {
                existingAdmin.setRole("ADMIN");
                userRepository.save(existingAdmin);
            }
        }, () -> {
            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            userRepository.save(admin);
        });
    }
}
