package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "services")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Service extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String code; // e.g. 2261

    private String name;

    @ElementCollection(targetClass = java.time.DayOfWeek.class)
    @CollectionTable(name = "service_operational_days", joinColumns = @JoinColumn(name = "service_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week")
    @Builder.Default
    private java.util.Set<java.time.DayOfWeek> operationalDays = java.util.EnumSet.allOf(java.time.DayOfWeek.class);

    @Column(name = "ciranda_sequence")
    private Integer cirandaSequence;

    @Column(name = "out_of_sequence")
    @Builder.Default
    private Boolean outOfSequence = false;

    @Column(name = "is_double_driven")
    @Builder.Default
    private Boolean isDoubleDriven = false;
}
