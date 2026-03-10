package com.vitae.api.repository;

import com.vitae.api.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByStatus(Driver.DriverStatus status);

    Optional<Driver> findByMatricula(String matricula);
}
