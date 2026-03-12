package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "segments")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Segment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnore
    private Service service;

    public Long getServiceId() {
        return service != null ? service.getId() : null;
    }

    @NotBlank
    @Column(nullable = false)
    private String origin;

    @NotBlank
    @Column(nullable = false)
    private String destination;

    private Integer estimatedDurationMinutes;

    private Integer sequence; // Order in the service

    private java.time.LocalDate activeDate;

    // Segment Ownership & Verification
    @ManyToOne
    @JoinColumn(name = "base_id")
    private Base base;

    @Builder.Default
    @Column(name = "has_error")
    private Boolean hasError = false;
    private String errorMessage;
    private String errorReportedBy;
    private java.time.LocalDateTime errorReportedAt;

    public void setOrigin(String origin) {
        this.origin = origin != null ? origin.toUpperCase() : null;
    }

    public void setDestination(String destination) {
        this.destination = destination != null ? destination.toUpperCase() : null;
    }
}
