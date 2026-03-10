package com.vitae.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class AuditConfig {
    // This enables JPA auditing for @CreatedDate, @LastModifiedDate, etc.
}
