package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Trip extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id", nullable = false)
    private Segment segment;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TripStatus status = TripStatus.SCHEDULED;

    @Builder.Default
    private Boolean isDobra = false;

    @Builder.Default
    private Boolean isPasse = false;

    @Builder.Default
    private Boolean isImpacted = false;

    @Builder.Default
    private Boolean hasRestViolation = false;

    private String violationMessage;

    private LocalDateTime actualArrivalTime;
}
