package com.vitae.api.service;

import com.vitae.api.model.Driver;
import com.vitae.api.model.Driver.DriverStatus;
import com.vitae.api.model.Trip;
import com.vitae.api.model.TripStatus;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private TripRepository tripRepository;

    @Transactional
    public Driver updateDriverStatus(Long driverId, DriverStatus newStatus) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        DriverStatus oldStatus = driver.getStatus();
        driver.setStatus(newStatus);
        driver.setLastStatusChange(LocalDateTime.now());
        Driver savedDriver = driverRepository.save(driver);

        // Synchronization logic
        if (newStatus == DriverStatus.FALTA || newStatus == DriverStatus.FERIAS ||
                newStatus == DriverStatus.ATESTADO || newStatus == DriverStatus.AFASTADO) {

            // Mark upcoming trips as FALTA or CANCELLED
            List<Trip> upcomingTrips = tripRepository.findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    driverId, LocalDateTime.now().minusHours(1));

            for (Trip trip : upcomingTrips) {
                if (trip.getStatus() == TripStatus.SCHEDULED || trip.getStatus() == TripStatus.IN_PROGRESS
                        || trip.getStatus() == TripStatus.DELAYED) {
                    if (newStatus == DriverStatus.FALTA) {
                        trip.setStatus(TripStatus.FALTA);
                    } else {
                        trip.setStatus(TripStatus.CANCELLED);
                    }
                    tripRepository.save(trip);
                }
            }
        } else if (newStatus == DriverStatus.DISPONIVEL && oldStatus == DriverStatus.FALTA) {
            // If returning from FALTA, try to restore scheduled trips
            List<Trip> markedFaltaTrips = tripRepository.findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    driverId, LocalDateTime.now().minusHours(1));

            for (Trip trip : markedFaltaTrips) {
                if (trip.getStatus() == TripStatus.FALTA) {
                    trip.setStatus(TripStatus.SCHEDULED);
                    tripRepository.save(trip);
                }
            }
        }

        return savedDriver;
    }

    @Transactional
    public Driver updateDriver(Long id, Driver details) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        driver.setName(details.getName());
        driver.setMatricula(details.getMatricula());
        driver.setBase(details.getBase());
        driver.setSaldoDias(details.getSaldoDias());

        if (driver.getStatus() != details.getStatus()) {
            return updateDriverStatus(id, details.getStatus());
        }

        return driverRepository.save(driver);
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void processRestingDrivers() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(36);
        List<Driver> restingDrivers = driverRepository.findByStatus(DriverStatus.FOLGA);

        for (Driver driver : restingDrivers) {
            if (driver.getLastStatusChange() != null && driver.getLastStatusChange().isBefore(threshold)) {
                driver.setStatus(DriverStatus.DISPONIVEL);
                driver.setLastStatusChange(LocalDateTime.now());
                driverRepository.save(driver);
            }
        }
    }
}
