package com.vitae.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "bases")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "drivers" })
public class Base extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String name;

    private String manager;

    @Enumerated(EnumType.STRING)
    private BaseType type;

    @Column(name = "parent_base_id")
    private Long parentBaseId;

    @OneToMany(mappedBy = "base", fetch = FetchType.LAZY)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("base")
    private java.util.List<User> users = new java.util.ArrayList<>();

    public enum BaseType {
        OPERACIONAL, PONTO_DE_APOIO
    }
}
