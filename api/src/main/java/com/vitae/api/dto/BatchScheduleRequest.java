package com.vitae.api.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BatchScheduleRequest {
    private Long serviceId;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime defaultDepartureTime;
}
