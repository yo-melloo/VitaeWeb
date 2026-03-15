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

    @Autowired
    private CirandaService cirandaService;

    public Trip createTrip(Trip trip) {
        validateBusinessRules(trip);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip markDelayed(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // Only change status if it hasn't started yet.
        if (trip.getStatus() == TripStatus.SCHEDULED) {
            trip.setStatus(TripStatus.DELAYED);
        }

        // Mark THIS trip as impacted too
        trip.setIsImpacted(true);
        Trip savedTrip = tripRepository.save(trip);

        // Propagate impact to next segment of the same service on the same day
        LocalDateTime startOfDay = trip.getDepartureTime().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = trip.getDepartureTime().toLocalDate().atTime(23, 59, 59);

        tripRepository.findByServiceIdAndDepartureTimeBetween(savedTrip.getServiceId(), startOfDay, endOfDay)
                .stream()
                .filter(t -> t.getDepartureTime().isAfter(savedTrip.getDepartureTime()))
                .sorted(java.util.Comparator.comparing(Trip::getDepartureTime))
                .findFirst().ifPresent(next -> {
                    next.setIsImpacted(true);
                    tripRepository.save(next);
                });

        // Propagate impact to next vehicle trip on the same day
        if (savedTrip.getVehicle() != null) {
            tripRepository.findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    savedTrip.getVehicle().getId(), savedTrip.getDepartureTime())
                    .stream()
                    .filter(t -> t.getDepartureTime().isBefore(endOfDay.plusNanos(1)))
                    .findFirst().ifPresent(next -> {
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

        // Clear impact on this trip
        trip.setIsImpacted(false);

        // If it was DELAYED, check where it should go back to
        if (trip.getStatus() == TripStatus.DELAYED) {
            // Presentation time: 1h before departure
            LocalDateTime presentationTime = trip.getDepartureTime().minusHours(1);
            if (LocalDateTime.now().isAfter(presentationTime)) {
                trip.setStatus(TripStatus.IN_PROGRESS);
            } else {
                trip.setStatus(TripStatus.SCHEDULED);
            }
        }

        Trip savedTrip = tripRepository.save(trip);

        // Try to clear impact on next service trip on the same day
        LocalDateTime startOfDay = trip.getDepartureTime().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = trip.getDepartureTime().toLocalDate().atTime(23, 59, 59);

        tripRepository.findByServiceIdAndDepartureTimeBetween(trip.getServiceId(), startOfDay, endOfDay)
                .stream()
                .filter(t -> t.getDepartureTime().isAfter(trip.getDepartureTime()))
                .sorted(java.util.Comparator.comparing(Trip::getDepartureTime))
                .findFirst().ifPresent(next -> {
                    next.setIsImpacted(false);
                    tripRepository.save(next);
                });

        // Try to clear impact on next vehicle trip on the same day
        if (trip.getVehicle() != null) {
            tripRepository.findByVehicleIdAndDepartureTimeAfterOrderByDepartureTimeAsc(
                    trip.getVehicle().getId(), trip.getDepartureTime())
                    .stream()
                    .filter(t -> t.getDepartureTime().isBefore(endOfDay.plusNanos(1)))
                    .findFirst().ifPresent(next -> {
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

        trip.setActualArrivalTime(actualArrival != null ? actualArrival : LocalDateTime.now());
        trip.setStatus(TripStatus.FINISHED);

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

    @Transactional
    public Trip revertTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (trip.getStatus() != TripStatus.FINISHED) {
            throw new RuntimeException("Apenas viagens finalizadas podem ser revertidas.");
        }

        // Removed 24h limit to allow reverting accidental finishes

        trip.setStatus(TripStatus.IN_PROGRESS);
        trip.setActualArrivalTime(null);

        if (trip.getDriver() != null) {
            Driver driver = trip.getDriver();
            driver.setStatus(DriverStatus.ESCALADO);
            driverRepository.save(driver);
        }

        if (trip.getVehicle() != null) {
            trip.getVehicle().setStatus(com.vitae.api.model.Vehicle.VehicleStatus.ON_TRIP);
            vehicleRepository.save(trip.getVehicle());
        }

        return tripRepository.save(trip);
    }

    private void validateBusinessRules(Trip trip) {
        Driver driver = trip.getDriver();

        if (driver != null) {
            // 1. Lógica de Dobra (Ciclo de 7 dias)
            int cycleDays = cirandaService.calculateCycleDays(driver.getId(), trip.getDepartureTime());
            System.out.println("DEBUG: Driver " + driver.getName() + " cycleDays: " + cycleDays + " for trip at " + trip.getDepartureTime());
            // Se já trabalhou 6 dias, esta viagem é o 7º dia (Dobra)
            if (cycleDays >= 6) {
                trip.setIsDobra(true);
            } else {
                trip.setIsDobra(false);
            }

            // 2. Lógica de Interjornada (11h de descanso)
            List<Trip> previousTrips = tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(
                    driver.getId(), trip.getDepartureTime());
            
            if (!previousTrips.isEmpty()) {
                Trip lastTrip = previousTrips.get(0);
                LocalDateTime arrivalOfLastTrip = lastTrip.getActualArrivalTime() != null 
                        ? lastTrip.getActualArrivalTime() 
                        : lastTrip.getArrivalTime();
                
                if (arrivalOfLastTrip != null) {
                    long minutesRest = java.time.Duration.between(arrivalOfLastTrip, trip.getDepartureTime()).toMinutes();
                    if (minutesRest < 11 * 60) {
                        trip.setHasRestViolation(true);
                        long hours = minutesRest / 60;
                        long mins = minutesRest % 60;
                        trip.setViolationMessage(String.format("Descanso insuficiente: apenas %dh %02dmin (Mínimo 11h)", hours, mins));
                    } else {
                        trip.setHasRestViolation(false);
                        trip.setViolationMessage(null);
                    }
                }
            } else {
                // Se não há viagens anteriores, assume que está descansado (ou recém-chegado da base)
                trip.setHasRestViolation(false);
                trip.setViolationMessage(null);
            }
        }
    }

    @Transactional
    public Trip updateTrip(Long id, Trip tripUpdate) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (tripUpdate.getDriver() != null) {
            trip.setDriver(tripUpdate.getDriver());
            // Se atribuiu motorista manual, garante que ele está ESCALADO se a viagem for
            // hoje/em progresso
            if (trip.getStatus() == TripStatus.IN_PROGRESS || trip.getStatus() == TripStatus.SCHEDULED) {
                trip.getDriver().setStatus(DriverStatus.ESCALADO);
                driverRepository.save(trip.getDriver());
            }
        }
        if (tripUpdate.getSegment() != null)
            trip.setSegment(tripUpdate.getSegment());
        if (tripUpdate.getServiceId() != null)
            trip.setServiceId(tripUpdate.getServiceId());
        if (tripUpdate.getDepartureTime() != null)
            trip.setDepartureTime(tripUpdate.getDepartureTime());
        if (tripUpdate.getVehicle() != null)
            trip.setVehicle(tripUpdate.getVehicle());
        if (tripUpdate.getStatus() != null)
            trip.setStatus(tripUpdate.getStatus());

        validateBusinessRules(trip);
        return tripRepository.save(trip);
    }

    @Transactional
    public void deleteTrip(Long id) {
        tripRepository.deleteById(id);
    }

    public Trip cancelTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        trip.setStatus(TripStatus.CANCELLED);
        if (trip.getDriver() != null) {
            trip.getDriver().setStatus(DriverStatus.DISPONIVEL);
            driverRepository.save(trip.getDriver());
        }
        return tripRepository.save(trip);
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
                // Presentation time (horário de apresentação) is 1h before departure
                .filter(trip -> trip.getDepartureTime().minusHours(1).isBefore(now)
                        || trip.getDepartureTime().minusHours(1).isEqual(now))
                .toList();

        for (Trip trip : scheduledTrips) {
            trip.setStatus(TripStatus.IN_PROGRESS);
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
