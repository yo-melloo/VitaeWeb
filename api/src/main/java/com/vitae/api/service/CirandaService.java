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

    public Driver suggestNextDriver(String originName, LocalDateTime departureTime) {
        return suggestNextDriver(originName, departureTime, null);
    }

    /**
     * Sugere o próximo motorista disponível na base de origem (`originName`)
     * que cumpra o tempo mínimo de descanso de 11h (Interjornada)
     * e as regras de giro (Limite de 5-6 dias).
     */
    public Driver suggestNextDriver(String originName, LocalDateTime departureTime, Long serviceId) {
        List<Driver> availableDrivers = driverRepository.findByStatus(Driver.DriverStatus.DISPONIVEL);
        List<DriverCandidate> candidates = new ArrayList<>();

        for (Driver driver : availableDrivers) {
            Trip lastTrip = tripRepository.findFirstByDriverIdOrderByDepartureTimeDesc(driver.getId());

            String currentLoc;
            LocalDateTime arrivalTime;
            boolean previouslyWorkedOnService = false;

            if (lastTrip != null) {
                currentLoc = lastTrip.getSegment().getDestination();
                arrivalTime = (lastTrip.getActualArrivalTime() != null)
                        ? lastTrip.getActualArrivalTime()
                        : lastTrip.getArrivalTime();

                if (serviceId != null && serviceId.equals(lastTrip.getServiceId())) {
                    previouslyWorkedOnService = true;
                }
            } else {
                currentLoc = (driver.getBase() != null) ? driver.getBase().getName() : "S/B";
                arrivalTime = LocalDateTime.MIN;
            }

            // 1. Predição de Sequência
            boolean isSequenced = false;
            if (serviceId != null) {
                Long predictedId = predictNextServiceId(driver.getId());
                if (serviceId.equals(predictedId)) {
                    isSequenced = true;
                }
            }

            // 2. Descanso (11h base + tempo de deslocamento se necessário)
            boolean atBase = originName.equalsIgnoreCase(currentLoc);
            long hoursRest = ChronoUnit.HOURS.between(arrivalTime, departureTime);

            if (hoursRest >= 11 || lastTrip == null) {
                // 3. Regras de Giro (Ciclo de Trabalho)
                int cycleDays = calculateCycleDays(driver.getId(), departureTime);
                if (cycleDays >= 7) continue;

                // Prioridade Noturna no Ciclo de 6 dias
                if (cycleDays == 6 && isNightShift(departureTime)) continue;

                // Prioridade:
                // Se estiver na base OU se for o próximo na sequência (mesmo em outra base)
                if (atBase || isSequenced) {
                    candidates.add(new DriverCandidate(driver, arrivalTime, previouslyWorkedOnService || isSequenced));
                }
            }
        }

        // Ordenação:
        // 1. Preferência por quem já faz este serviço (especialmente para Out of
        // Sequence)
        // 2. Menor tempo de chegada (quem está descansando há mais tempo)
        candidates.sort(Comparator
                .comparing(DriverCandidate::isPreferred, Comparator.reverseOrder())
                .thenComparing(DriverCandidate::getArrivalTime));

        return candidates.isEmpty() ? null : candidates.get(0).getDriver();
    }

    @Autowired
    private com.vitae.api.repository.ServiceRepository serviceRepository;

    private Long predictNextServiceId(Long driverId) {
        List<com.vitae.api.model.Service> allServices = serviceRepository
                .findAllByOutOfSequenceFalseOrderByCirandaSequenceAsc();
        if (allServices.isEmpty()) return null;

        Trip lastFinishedTrip = tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(
                driverId, LocalDateTime.now()).stream()
                .filter(t -> t.getStatus() == com.vitae.api.model.TripStatus.FINISHED)
                .findFirst()
                .orElse(null);

        if (lastFinishedTrip == null) return null;
        Long lastServiceId = lastFinishedTrip.getServiceId();

        int currentIndex = -1;
        for (int i = 0; i < allServices.size(); i++) {
            if (allServices.get(i).getId().equals(lastServiceId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) return null;
        int nextIndex = (currentIndex + 1) % allServices.size();
        return allServices.get(nextIndex).getId();
    }

    public com.vitae.api.dto.DriverSequenceDTO getDriverSequencePrediction(Long driverId) {
        List<com.vitae.api.model.Service> allServices = serviceRepository
                .findAllByOutOfSequenceFalseOrderByCirandaSequenceAsc();

        if (allServices.isEmpty()) {
            return com.vitae.api.dto.DriverSequenceDTO.builder()
                    .currentSequence(new ArrayList<>())
                    .predictedNextServiceCode("N/A")
                    .build();
        }

        List<Trip> driverTrips = tripRepository.findByDriverIdOrderByDepartureTimeAsc(driverId);

        Trip lastFinishedTrip = driverTrips.stream()
                .filter(t -> t.getStatus() == com.vitae.api.model.TripStatus.FINISHED)
                .reduce((first, second) -> second)
                .orElse(null);

        Trip currentTrip = driverTrips.stream()
                .filter(t -> t.getStatus() == com.vitae.api.model.TripStatus.SCHEDULED
                        || t.getStatus() == com.vitae.api.model.TripStatus.IN_PROGRESS
                        || t.getStatus() == com.vitae.api.model.TripStatus.DELAYED)
                .findFirst()
                .orElse(null);

        Long currentServiceId = currentTrip != null ? currentTrip.getServiceId() : null;
        Long lastServiceId = lastFinishedTrip != null ? lastFinishedTrip.getServiceId() : null;

        Long nextServiceId = predictNextServiceId(driverId);
        com.vitae.api.model.Service nextService = nextServiceId != null 
            ? serviceRepository.findById(nextServiceId).orElse(null) : null;

        List<com.vitae.api.dto.DriverSequenceDTO.ServiceInfo> currentSequence = new ArrayList<>();
        for (int i = 0; i < allServices.size(); i++) {
            com.vitae.api.model.Service s = allServices.get(i);
            boolean isCurr = currentServiceId != null && s.getId().equals(currentServiceId);
            boolean isPast = lastServiceId != null && s.getId().equals(lastServiceId) && !isCurr;
            boolean isNext = nextService != null && s.getId().equals(nextService.getId()) && !isCurr;

            currentSequence.add(com.vitae.api.dto.DriverSequenceDTO.ServiceInfo.builder()
                    .id(s.getId())
                    .code(s.getCode())
                    .name(s.getName())
                    .sequence(s.getCirandaSequence() != null ? s.getCirandaSequence() : i)
                    .isCurrent(isCurr)
                    .isPast(isPast)
                    .isNext(isNext)
                    .build());
        }

        return com.vitae.api.dto.DriverSequenceDTO.builder()
                .currentSequence(currentSequence)
                .currentServiceId(currentServiceId)
                .nextServiceId(nextService != null ? nextService.getId() : null)
                .predictedNextServiceCode(nextService != null ? nextService.getCode() : "N/A")
                .build();
    }

    /**
     * Calcula quantos dias o motorista está em sequência de trabalho.
     * Um ciclo reseta após uma folga >= 36h.
     */
    public int calculateCycleDays(Long driverId, LocalDateTime targetDate) {
        List<Trip> trips = tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(driverId,
                targetDate);
        if (trips.isEmpty())
            return 0;

        java.util.Set<java.time.LocalDate> workedDays = new java.util.HashSet<>();
        LocalDateTime lastReference = targetDate;

        for (Trip trip : trips) {
            // Ignora viagens que não representam trabalho efetivo ou presença
            if (trip.getStatus() == com.vitae.api.model.TripStatus.CANCELLED || 
                trip.getStatus() == com.vitae.api.model.TripStatus.FALTA) {
                continue;
            }

            LocalDateTime departure = trip.getDepartureTime();
            LocalDateTime arrival = (trip.getActualArrivalTime() != null) ? trip.getActualArrivalTime()
                    : (trip.getArrivalTime() != null ? trip.getArrivalTime() : trip.getDepartureTime());

            // Se houve um gap de 36h entre esta viagem e a próxima (na cronologia), o ciclo
            // resetou.
            if (arrival != null && ChronoUnit.HOURS.between(arrival, lastReference) >= 36) {
                break;
            }

            // Adiciona os dias em que houve trabalho nesta viagem
            java.time.LocalDate start = departure.toLocalDate();
            java.time.LocalDate end = arrival.toLocalDate();
            while (!start.isAfter(end)) {
                workedDays.add(start);
                start = start.plusDays(1);
            }

            lastReference = departure;
        }

        return workedDays.size();
    }

    public boolean isNightShift(LocalDateTime time) {
        int hour = time.getHour();
        // Noturno: 18:00 às 05:00
        return hour >= 18 || hour < 5;
    }

    private static class DriverCandidate {
        private final Driver driver;
        private final LocalDateTime arrivalTime;
        private final boolean preferred;

        public DriverCandidate(Driver driver, LocalDateTime arrivalTime, boolean preferred) {
            this.driver = driver;
            this.arrivalTime = arrivalTime;
            this.preferred = preferred;
        }

        public Driver getDriver() {
            return driver;
        }

        public LocalDateTime getArrivalTime() {
            return arrivalTime;
        }

        public boolean isPreferred() {
            return preferred;
        }
    }
}
