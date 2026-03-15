package com.vitae.api.repository;

import com.vitae.api.model.Trip;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findAll();

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findByDriverIdOrderByDepartureTimeAsc(Long driverId);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findByDriverIdAndDepartureTimeBetweenOrderByDepartureTimeAsc(
            Long driverId, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findByServiceIdAndDepartureTimeBetween(Long serviceId, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(Long driverId, LocalDateTime time);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    List<Trip> findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(Long vehicleId, LocalDateTime time);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    Trip findFirstByDriverIdOrderByDepartureTimeDesc(Long driverId);

    @EntityGraph(attributePaths = {"segment", "segment.service", "segment.base", "driver", "vehicle"})
    java.util.List<Trip> findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(Long driverId,
            LocalDateTime time);
}
