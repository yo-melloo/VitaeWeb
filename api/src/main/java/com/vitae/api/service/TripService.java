package com.vitae.api.service;

import com.vitae.api.model.Driver;
import com.vitae.api.model.Trip;
import com.vitae.api.model.TripStatus;
import com.vitae.api.model.Driver.DriverStatus;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private com.vitae.api.repository.VehicleRepository vehicleRepository;

    public Trip createTrip(Trip trip) {
        validateBusinessRules(trip);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip markDelayed(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(TripStatus.DELAYED);
        Trip savedTrip = tripRepository.save(trip);

        // Propagate impact to next driver trip
        tripRepository.findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                trip.getDriver().getId(), trip.getDepartureTime())
                .stream().findFirst().ifPresent(next -> {
                    next.setIsImpacted(true);
                    tripRepository.save(next);
                });

        // Propagate impact to next vehicle trip
        if (trip.getVehicle() != null) {
            tripRepository.findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    trip.getVehicle().getId(), trip.getDepartureTime())
                    .stream().findFirst().ifPresent(next -> {
                        next.setIsImpacted(true);
                        tripRepository.save(next);
                    });
        }

        return savedTrip;
    }

    @Transactional
    public Trip clearDelay(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(TripStatus.SCHEDULED);
        trip.setIsImpacted(false); // A delayed trip can also be impacted, so we clear both
        Trip savedTrip = tripRepository.save(trip);

        // Try to clear impact on next driver trip
        tripRepository.findByDriverIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                trip.getDriver().getId(), trip.getDepartureTime())
                .stream().findFirst().ifPresent(next -> {
                    next.setIsImpacted(false);
                    tripRepository.save(next);
                });

        // Try to clear impact on next vehicle trip
        if (trip.getVehicle() != null) {
            tripRepository.findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    trip.getVehicle().getId(), trip.getDepartureTime())
                    .stream().findFirst().ifPresent(next -> {
                        next.setIsImpacted(false);
                        tripRepository.save(next);
                    });
        }

        return savedTrip;
    }

    @Transactional
    public Trip markNoShow(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(TripStatus.FALTA);
        Trip savedTrip = tripRepository.save(trip);

        if (trip.getDriver() != null) {
            Driver driver = trip.getDriver();
            driver.setStatus(DriverStatus.FALTA);
            driverRepository.save(driver);
        }

        return savedTrip;
    }

    @Transactional
    public Trip clearNoShow(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(TripStatus.SCHEDULED);
        Trip savedTrip = tripRepository.save(trip);

        if (trip.getDriver() != null) {
            Driver driver = trip.getDriver();
            driver.setStatus(DriverStatus.DISPONIVEL);
            driverRepository.save(driver);
        }

        return savedTrip;
    }

    @Transactional
    public Trip updateArrivalTime(Long tripId, LocalDateTime actualArrival) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        if (trip.getDriver() != null) {
            Driver driver = trip.getDriver();
            driver.setStatus(DriverStatus.FOLGA);
            driver.setLastStatusChange(LocalDateTime.now());
            driverRepository.save(driver);
        }
        if (trip.getVehicle() != null) {
            trip.getVehicle().setStatus(com.vitae.api.model.Vehicle.VehicleStatus.AVAILABLE);
            vehicleRepository.save(trip.getVehicle());
        }
        return tripRepository.save(trip);
    }

    private void validateBusinessRules(Trip trip) {
        Driver driver = trip.getDriver();

        // 1. Dobra Logic: > 7 days in saldoDias
        if (driver != null && driver.getSaldoDias() != null && driver.getSaldoDias() > 7) {
            trip.setIsDobra(true);
        }

        // 3. Operational Days Rule
        if (trip.getSegment() != null && trip.getSegment().getService() != null) {
            // com.vitae.api.model.Service service = trip.getSegment().getService();
            // java.time.DayOfWeek departureDay = trip.getDepartureTime().getDayOfWeek();

            // Desativado a pedido do cliente para permitir escalas avulsas:
            // if (!service.getOperationalDays().contains(departureDay)) {
            // trip.setStatus(com.vitae.api.model.TripStatus.CANCELLED);
            // }
        }
    }

    @Transactional
    public Trip cancelTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        trip.setStatus(TripStatus.CANCELLED);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip updateTrip(Long tripId, Trip currentData) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (currentData.getDriver() != null)
            trip.setDriver(currentData.getDriver());
        if (currentData.getSegment() != null)
            trip.setSegment(currentData.getSegment());
        if (currentData.getServiceId() != null)
            trip.setServiceId(currentData.getServiceId());
        if (currentData.getDepartureTime() != null)
            trip.setDepartureTime(currentData.getDepartureTime());
        if (currentData.getVehicle() != null)
            trip.setVehicle(currentData.getVehicle());
        if (currentData.getStatus() != null) {
            trip.setStatus(currentData.getStatus());
            // Auto-reparação: Se a viagem for iniciada, limpa o status de falta
            if (currentData.getStatus() == TripStatus.IN_PROGRESS) {
                if (trip.getDriver() != null && trip.getDriver().getStatus() == DriverStatus.FALTA) {
                    trip.getDriver().setStatus(DriverStatus.DISPONIVEL);
                    driverRepository.save(trip.getDriver());
                }
            }
            // Transição para FOLGA e AVAILABLE ao finalizar
            if (currentData.getStatus() == TripStatus.FINISHED) {
                if (trip.getDriver() != null) {
                    Driver driver = trip.getDriver();
                    driver.setStatus(DriverStatus.FOLGA);
                    driver.setLastStatusChange(LocalDateTime.now());
                    driverRepository.save(driver);
                }
                if (trip.getVehicle() != null) {
                    trip.getVehicle().setStatus(com.vitae.api.model.Vehicle.VehicleStatus.AVAILABLE);
                    vehicleRepository.save(trip.getVehicle());
                }
            }
            // Transição para ON_TRIP ao iniciar
            if (currentData.getStatus() == TripStatus.IN_PROGRESS) {
                if (trip.getVehicle() != null) {
                    trip.getVehicle().setStatus(com.vitae.api.model.Vehicle.VehicleStatus.ON_TRIP);
                    vehicleRepository.save(trip.getVehicle());
                }
            }
        }
        return tripRepository.save(trip);
    }

    @Transactional
    public void deleteTrip(Long tripId) {
        tripRepository.deleteById(tripId);
    }

    public String checkRestCompliance(Driver driver, LocalDateTime newDepartureTime) {
        // Mock logic for demonstration, real logic would query TripRepository
        return "OK";
    }

    public List<Trip> listTrips() {
        return tripRepository.findAll();
    }

    public List<Trip> listTripsByDriver(Long driverId) {
        return tripRepository.findByDriverIdOrderByDepartureTimeAsc(driverId);
    }

    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void processTemporalTransitions() {
        LocalDateTime now = LocalDateTime.now();
        List<Trip> scheduledTrips = tripRepository.findAll().stream()
                .filter(trip -> (trip.getStatus() == TripStatus.SCHEDULED || trip.getStatus() == TripStatus.DELAYED))
                .filter(trip -> trip.getDepartureTime().isBefore(now) || trip.getDepartureTime().isEqual(now))
                .toList();

        for (Trip trip : scheduledTrips) {
            trip.setStatus(TripStatus.IN_PROGRESS);
            // Auto-reparação logic is already in updateTrip, but we repeat it here just in
            // case
            if (trip.getDriver() != null && trip.getDriver().getStatus() == DriverStatus.FALTA) {
                trip.getDriver().setStatus(DriverStatus.DISPONIVEL);
                driverRepository.save(trip.getDriver());
            }
            if (trip.getVehicle() != null) {
                trip.getVehicle().setStatus(com.vitae.api.model.Vehicle.VehicleStatus.ON_TRIP);
                vehicleRepository.save(trip.getVehicle());
            }
            tripRepository.save(trip);
        }
    }
}
