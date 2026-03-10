package com.vitae.api.service;

import com.vitae.api.model.Driver;
import com.vitae.api.model.Trip;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CirandaService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private TripRepository tripRepository;

    /**
     * Sugere o próximo motorista dispoível na base de origem (`originName`)
     * que cumpra o tempo mínimo de descanso de 11h (Interjornada).
     */
    public Driver suggestNextDriver(String originName, LocalDateTime departureTime) {
        List<Driver> availableDrivers = driverRepository.findByStatus(Driver.DriverStatus.DISPONIVEL);
        List<DriverCandidate> candidates = new ArrayList<>();

        for (Driver driver : availableDrivers) {
            Trip lastTrip = tripRepository.findFirstByDriverIdOrderByDepartureTimeDesc(driver.getId());

            String currentLoc;
            LocalDateTime arrivalTime;

            if (lastTrip != null) {
                // Localização atual é o destino da última viagem
                currentLoc = lastTrip.getSegment().getDestination();
                // Usa a chegada real, se houver, ou a prevista
                arrivalTime = lastTrip.getActualArrivalTime() != null
                        ? lastTrip.getActualArrivalTime()
                        : lastTrip.getArrivalTime();
            } else {
                // Sem viagens, sua localização atual é sua base
                currentLoc = (driver.getBase() != null) ? driver.getBase().getName() : "S/B";
                arrivalTime = LocalDateTime.MIN; // Disponível desde sempre
            }

            // O motorista deve estar na base de origem desejada
            if (originName.equalsIgnoreCase(currentLoc)) {
                // Deve cumprir 11h de interjornada (Rest Rule)
                long hoursRest = ChronoUnit.HOURS.between(arrivalTime, departureTime);
                if (hoursRest >= 11 || lastTrip == null) {
                    candidates.add(new DriverCandidate(driver, arrivalTime));
                }
            }
        }

        // Ordena pela data de chegada (FIFO: O quem chegou primeiro na ciranda/fila)
        candidates.sort(Comparator.comparing(DriverCandidate::getArrivalTime));

        if (candidates.isEmpty()) {
            return null;
        }

        return candidates.get(0).getDriver();
    }

    // Classe auxiliar para ordenação da fila (Ciranda)
    private static class DriverCandidate {
        private final Driver driver;
        private final LocalDateTime arrivalTime;

        public DriverCandidate(Driver driver, LocalDateTime arrivalTime) {
            this.driver = driver;
            this.arrivalTime = arrivalTime;
        }

        public Driver getDriver() {
            return driver;
        }

        public LocalDateTime getArrivalTime() {
            return arrivalTime;
        }
    }
}
