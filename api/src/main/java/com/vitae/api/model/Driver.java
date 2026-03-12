package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Entity
@Table(name = "drivers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Driver extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Pattern(regexp = "\\d{1,5}")
    @Column(unique = true, nullable = false)
    private String matricula; // Up to 5 digits

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_id", nullable = false)
    @JsonIgnoreProperties("drivers")
    private Base base;

    @Builder.Default
    private Integer saldoDias = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DriverStatus status = DriverStatus.DISPONIVEL;

    private LocalDateTime lastStatusChange;

    public void setName(String name) {
        this.name = name != null ? name.toUpperCase() : null;
    }

    public enum DriverStatus {
        DISPONIVEL, FOLGA, ESCALADO, FALTA, ATESTADO, AFASTADO, FERIAS, SOBRANDO,
        AVAILABLE, TRIP, RESTING, OFF, SICK, AWAY
    }
}
