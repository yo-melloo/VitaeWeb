package com.vitae.api.service;

import com.vitae.api.dto.BatchScheduleRequest;
import com.vitae.api.model.*;
import com.vitae.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BatchScheduleService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private SegmentRepository segmentRepository;

    @Autowired
    private TripService tripService;

    @Autowired
    private CirandaService cirandaService;

    @Autowired
    private TripRepository tripRepository;

    @Transactional
    public List<Trip> generateBatch(BatchScheduleRequest request) {
        com.vitae.api.model.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        List<Segment> segments = segmentRepository.findByService_IdOrderBySequenceAsc(request.getServiceId());
        List<Trip> generatedTrips = new ArrayList<>();

        LocalDate current = request.getStartDate();
        if (request.getEndDate().isAfter(current.plusDays(14))) {
            throw new RuntimeException("Geração limitada ao máximo de 14 dias por vez para segurança operacional.");
        }

        while (!current.isAfter(request.getEndDate())) {
            if (service.getOperationalDays().contains(current.getDayOfWeek())) {
                LocalDateTime departureTime = current.atTime(request.getDefaultDepartureTime());

                for (Segment segment : segments) {
                    // Filter by activeDate: use segment if activeDate is null or matches current
                    // date
                    if (segment.getActiveDate() != null && !segment.getActiveDate().equals(current)) {
                        continue;
                    }
                    com.vitae.api.config.AuditorAwareImpl.setAuditor("CIRANDA_SYSTEM");
                    try {
                        Driver autoDriver = cirandaService.suggestNextDriver(segment.getOrigin(), departureTime, service.getId());
                        
                        // Lógica de Automação de PASSE
                        if (autoDriver != null) {
                            Trip lastTrip = tripRepository.findFirstByDriverIdOrderByDepartureTimeDesc(autoDriver.getId());
                            String currentLoc = lastTrip != null ? lastTrip.getSegment().getDestination() 
                                              : (autoDriver.getBase() != null ? autoDriver.getBase().getName() : null);
                            
                            if (currentLoc != null && !segment.getOrigin().equalsIgnoreCase(currentLoc)) {
                                // Motorista está em outra base. Gerar PASSE.
                                // Regra: Chegar 11h antes da partida.
                                LocalDateTime arrivalAtTarget = departureTime.minusHours(11);
                                int travelTime = 360; // 6h padrão de deslocamento
                                LocalDateTime departureOfPasse = arrivalAtTarget.minusMinutes(travelTime);
                                
                                Trip passe = Trip.builder()
                                    .driver(autoDriver)
                                    .serviceId(service.getId())
                                    .departureTime(departureOfPasse)
                                    .arrivalTime(arrivalAtTarget)
                                    .status(TripStatus.PASSE)
                                    .isPasse(true)
                                    .build();
                                
                                // Tenta achar um trecho que ligue os pontos para o passe
                                segmentRepository.findAll().stream()
                                    .filter(s -> s.getOrigin().equalsIgnoreCase(currentLoc) && s.getDestination().equalsIgnoreCase(segment.getOrigin()))
                                    .findFirst()
                                    .ifPresent(passe::setSegment);
                                
                                tripService.createTrip(passe);
                                // Nota: O passe não vai para generatedTrips pois é uma viagem de apoio
                            }
                        }

                        int duration = (segment.getEstimatedDurationMinutes() != null)
                                ? segment.getEstimatedDurationMinutes()
                                : 60;

                        Trip trip = Trip.builder()
                                .segment(segment)
                                .serviceId(segment.getService().getId())
                                .driver(autoDriver)
                                .departureTime(departureTime)
                                .arrivalTime(departureTime.plusMinutes(duration))
                                .status(TripStatus.SCHEDULED)
                                .build();

                        // Use TripService to apply business rules (Dobra, Rest)
                        Trip savedTrip = tripService.createTrip(trip);
                        generatedTrips.add(savedTrip);

                        // Set next departure time for subsequent segment in sequence
                        LocalDateTime arrivalTimeForBuffer = savedTrip.getArrivalTime() != null
                                ? savedTrip.getArrivalTime()
                                : departureTime.plusMinutes(duration);
                        departureTime = arrivalTimeForBuffer.plusMinutes(30); // 30 min buffer
                    } finally {
                        com.vitae.api.config.AuditorAwareImpl.clear();
                    }
                }
            }
            current = current.plusDays(1);
        }

        return generatedTrips;
    }

    @Transactional
    public List<Trip> generateAllSequenced(java.time.LocalDate startDate, java.time.LocalDate endDate,
            java.time.LocalTime defaultTime) {
        List<com.vitae.api.model.Service> services = serviceRepository
                .findAllByOutOfSequenceFalseOrderByCirandaSequenceAsc();
        List<Trip> allTrips = new ArrayList<>();

        for (com.vitae.api.model.Service service : services) {
            BatchScheduleRequest request = new BatchScheduleRequest();
            request.setServiceId(service.getId());
            request.setStartDate(startDate);
            request.setEndDate(endDate);
            request.setDefaultDepartureTime(defaultTime);

            allTrips.addAll(generateBatch(request));
        }

        return allTrips;
    }
}
