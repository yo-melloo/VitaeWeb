package com.vitae.api.dto;

import com.vitae.api.model.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripDTO {
    private Long id;
    private Long serviceId;
    private String serviceCode;
    private String routeName;
    private TripStatus status;
    private Boolean isImpacted;
    private Boolean hasRestViolation;
    private String violationMessage;
    private Boolean isDobra;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private LocalDateTime actualArrivalTime;
    private SegmentDTO segment;
    private DriverDTO driver;
    private DriverDTO secondaryDriver;
    private VehicleDTO vehicle;
    private String updatedBy;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SegmentDTO {
        private Long id;
        private String origin;
        private String destination;
        private Integer sequence;
        private Long totalSegments;
        private BaseDTO base;
        private Boolean hasError;
        private String errorMessage;
        private String errorReportedBy;
        private LocalDateTime errorReportedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BaseDTO {
        private Long id;
        private String name;
        private Long parentBaseId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverDTO {
        private Long id;
        private String name;
        private String matricula;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleDTO {
        private Long id;
        private String plate;
        private String prefix;
        private String model;
    }
}
