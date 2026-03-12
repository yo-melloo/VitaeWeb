package com.vitae.api.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuditorAwareImpl implements AuditorAware<String> {

    private static final ThreadLocal<String> AUDITOR_OVERRIDE = new ThreadLocal<>();

    public static void setAuditor(String auditor) {
        AUDITOR_OVERRIDE.set(auditor);
    }

    public static void clear() {
        AUDITOR_OVERRIDE.remove();
    }

    @Override
    public Optional<String> getCurrentAuditor() {
        String override = AUDITOR_OVERRIDE.get();
        if (override != null)
            return Optional.of(override);

        // For now, return a mock user. Later this will integrate with Spring Security.
        return Optional.of("system_admin");
    }
}
