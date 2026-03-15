package com.vitae.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DobraReportDTO {
    private List<DriverDobraDTO> driversInDobra;
    private int totalDrivers;
    private int driversWithViolations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverDobraDTO {
        private Long driverId;
        private String driverName;
        private String matricula;
        private int consecutiveDays;
        private List<TripSummaryDTO> recentTrips;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripSummaryDTO {
        private Long tripId;
        private String route;
        private String departureTime;
        private boolean isDobra;
    }
}
