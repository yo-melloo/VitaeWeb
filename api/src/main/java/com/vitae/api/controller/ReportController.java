package com.vitae.api.controller;

import com.vitae.api.dto.DobraReportDTO;
import com.vitae.api.model.Driver;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.service.CirandaService;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private CirandaService cirandaService;

    @Autowired
    private TripRepository tripRepository;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/dobras")
    public ResponseEntity<DobraReportDTO> getDobraReport() {
        List<Driver> allDrivers = driverRepository.findAll();
        List<DobraReportDTO.DriverDobraDTO> driversInDobra = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Driver driver : allDrivers) {
            int cycleDays = cirandaService.calculateCycleDays(driver.getId(), now);
            
            if (cycleDays >= 7) {
                List<DobraReportDTO.TripSummaryDTO> recentTrips = tripRepository.findByDriverIdAndDepartureTimeBeforeOrderByDepartureTimeDesc(
                        driver.getId(), now.plusDays(1))
                        .stream()
                        .limit(5)
                        .map(t -> DobraReportDTO.TripSummaryDTO.builder()
                                .tripId(t.getId())
                                .route(t.getSegment() != null ? t.getSegment().getOrigin() + " x " + t.getSegment().getDestination() : "N/A")
                                .departureTime(t.getDepartureTime().toString())
                                .isDobra(t.getIsDobra() != null && t.getIsDobra())
                                .build())
                        .collect(Collectors.toList());

                driversInDobra.add(DobraReportDTO.DriverDobraDTO.builder()
                        .driverId(driver.getId())
                        .driverName(driver.getName())
                        .matricula(driver.getMatricula())
                        .consecutiveDays(cycleDays)
                        .recentTrips(recentTrips)
                        .build());
            }
        }

        return ResponseEntity.ok(DobraReportDTO.builder()
                .driversInDobra(driversInDobra)
                .totalDrivers(allDrivers.size())
                .driversWithViolations(driversInDobra.size())
                .build());
    }
}
