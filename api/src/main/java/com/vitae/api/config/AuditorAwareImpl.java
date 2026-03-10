package com.vitae.api.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        // For now, return a mock user. Later this will integrate with Spring Security.
        return Optional.of("system_admin");
    }
}
