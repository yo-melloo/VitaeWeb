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
public class DriverSequenceDTO {
    private List<ServiceInfo> currentSequence;
    private Long currentServiceId;
    private Long nextServiceId;
    private String predictedNextServiceCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceInfo {
        private Long id;
        private String code;
        private String name;
        private Integer sequence;
        private boolean isPast;
        private boolean isCurrent;
        private boolean isNext;
    }
}
