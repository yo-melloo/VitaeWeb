package com.vitae.api.repository;

import com.vitae.api.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByDriverIdOrderByDepartureTimeAsc(Long driverId);

    List<Trip> findByDriverIdAndDepartureTimeBetweenOrderByDepartureTimeAsc(
            Long driverId, LocalDateTime start, LocalDateTime end);

    List<Trip> findByServiceIdAndDepartureTimeBetween(Long serviceId, LocalDateTime start, LocalDateTime end);

    List<Trip> findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(Long driverId, LocalDateTime time);

    List<Trip> findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(Long vehicleId, LocalDateTime time);

    Trip findFirstByDriverIdOrderByDepartureTimeDesc(Long driverId);
}
