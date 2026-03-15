package com.vitae.api.service;

import com.vitae.api.model.Driver;
import com.vitae.api.model.Segment;
import com.vitae.api.model.Trip;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CirandaServiceTest {

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private TripRepository tripRepository;

    @InjectMocks
    private CirandaService cirandaService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSuggestNextDriver_Enforces11hRest() {
        Driver driver = new Driver();
        driver.setId(1L);
        driver.setStatus(Driver.DriverStatus.DISPONIVEL);

        Trip lastTrip = new Trip();
        lastTrip.setSegment(Segment.builder().destination("Imperatriz").build());
        lastTrip.setArrivalTime(LocalDateTime.of(2026, 3, 14, 8, 0)); // Chegou às 08:00

        when(driverRepository.findByStatus(Driver.DriverStatus.DISPONIVEL)).thenReturn(List.of(driver));
        when(tripRepository.findFirstByDriverIdOrderByDepartureTimeDesc(1L)).thenReturn(lastTrip);
        // Garantindo que calculateCycleDays retorne algo baixo para não interferir
        when(tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(eq(1L), any()))
                .thenReturn(Collections.emptyList());

        // Tenta escalar às 18:00 (10h de descanso) -> Deve retornar null
        Driver suggested = cirandaService.suggestNextDriver("Imperatriz", LocalDateTime.of(2026, 3, 14, 18, 0));
        assertNull(suggested);

        // Tenta escalar às 19:00 (11h de descanso) -> Deve retornar o motorista
        suggested = cirandaService.suggestNextDriver("Imperatriz", LocalDateTime.of(2026, 3, 14, 19, 0));
        assertNotNull(suggested);
        assertEquals(1L, suggested.getId());
    }

    @Test
    void testSuggestNextDriver_Enforces6thDayShiftRule() {
        Driver driver = new Driver();
        driver.setId(1L);
        driver.setStatus(Driver.DriverStatus.DISPONIVEL);

        // Simula motorista que já trabalhou 6 dias (ciclo resetado antes disso)
        List<Trip> cycleTrips = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            LocalDateTime day = LocalDateTime.of(2026, 3, 14, 8, 0).minusDays(i);
            Trip trip = new Trip();
            trip.setDepartureTime(day);
            trip.setArrivalTime(day.plusHours(8));
            cycleTrips.add(trip);
        }

        when(driverRepository.findByStatus(Driver.DriverStatus.DISPONIVEL)).thenReturn(List.of(driver));
        when(tripRepository.findFirstByDriverIdOrderByDepartureTimeDesc(1L)).thenReturn(cycleTrips.get(0));
        when(tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(eq(1L), any()))
                .thenReturn(cycleTrips);

        // No 6º dia, Plantão Diurno (ex: 10:00) -> PERMITIDO
        Driver suggestedDay = cirandaService.suggestNextDriver("S/B", LocalDateTime.of(2026, 3, 14, 10, 0));
        assertNotNull(suggestedDay);

        // No 6º dia, Plantão Noturno (ex: 20:00) -> PROIBIDO (terminaria no 7º)
        Driver suggestedNight = cirandaService.suggestNextDriver("S/B", LocalDateTime.of(2026, 3, 14, 20, 0));
        assertNull(suggestedNight);
    }

    @Test
    void testCalculateCycleDays_ResetsAfter36h() {
        // Criando sequência de viagens
        List<Trip> trips = new ArrayList<>();

        // Viagem hoje (Day 0)
        trips.add(createMockTrip(0, 8, 16));
        // Viagem ontem (Day 1)
        trips.add(createMockTrip(1, 8, 16));
        // Gap de 40h aqui
        // Viagem de 3 dias atrás (Day 3)
        trips.add(createMockTrip(3, 8, 16));

        when(tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(eq(1L), any()))
                .thenReturn(trips);

        int cycleDays = cirandaService.calculateCycleDays(1L, LocalDateTime.now());

        // Deve contar apenas Day 0 e Day 1 (2 dias) porque o gap de 40h resetou o ciclo
        assertEquals(2, cycleDays);
    }

    private Trip createMockTrip(int daysAgo, int startHour, int endHour) {
        LocalDateTime base = LocalDateTime.of(2026, 3, 14, 0, 0).minusDays(daysAgo);
        Trip trip = new Trip();
        trip.setDepartureTime(base.withHour(startHour));
        trip.setArrivalTime(base.withHour(endHour));
        return trip;
    }
}
