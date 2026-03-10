package com.vitae.api.service;

import com.vitae.api.model.*;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CancellationService {

    @Autowired
    private TripRepository tripRepository;

    @Transactional
    public void cancelService(Long serviceId, LocalDateTime start, LocalDateTime end) {
        List<Trip> tripsToCancel = tripRepository.findByServiceIdAndDepartureTimeBetween(serviceId, start, end);

        for (Trip trip : tripsToCancel) {
            trip.setStatus(TripStatus.CANCELLED);
            tripRepository.save(trip);

            // Generate Passe if driver is away from base
            generatePasseIfNeeded(trip);
        }
    }

    private void generatePasseIfNeeded(Trip cancelledTrip) {
        Driver driver = cancelledTrip.getDriver();
        if (driver == null)
            return;

        // Simplified Logic: If destination is NOT the driver's base, generate a return
        // Passe
        // In a real scenario, this would check the next segment in the rotation
        /*
         * if (driver.getBase() != null
         * &&
         * !cancelledTrip.getSegment().getDestination().equalsIgnoreCase(driver.getBase(
         * ).getName())) {
         * Trip passe = Trip.builder()
         * .driver(driver)
         * .vehicle(cancelledTrip.getVehicle())
         * .departureTime(cancelledTrip.getDepartureTime().plusHours(1))
         * .status(TripStatus.PASSE)
         * .isPasse(true)
         * .build();
         * 
         * // tripRepository.save(passe);
         * }
         */
    }
}
