package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "vehicles")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Vehicle extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String prefix;

    private String plate;

    @NotBlank
    private String model;

    private Integer capacity;

    private Integer currentMileage;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    public enum VehicleStatus {
        AVAILABLE, ON_TRIP, MAINTENANCE, OUT_OF_SERVICE, OPERATIONAL
    }
}
