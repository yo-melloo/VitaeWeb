package com.vitae.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String matricula;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @NotBlank
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private UserProfile profile;

    @ManyToOne
    @JoinColumn(name = "base_id")
    private Base base;

    public enum UserProfile {
        ADMIN, OPERATOR, VIEWER, DRIVER, PENDING
    }

    public enum UserStatus {
        PENDING, APPROVED, REJECTED, BLOCKED
    }
}
