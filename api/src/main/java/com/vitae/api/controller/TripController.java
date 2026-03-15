package com.vitae.api.controller;

import com.vitae.api.dto.TripDTO;
import com.vitae.api.model.Trip;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.repository.SegmentRepository;
import com.vitae.api.repository.ServiceRepository;
import com.vitae.api.repository.VehicleRepository;
import com.vitae.api.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private TripService tripService;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private SegmentRepository segmentRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @GetMapping
    public ResponseEntity<List<TripDTO>> listTrips(
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) String matricula) {

        List<com.vitae.api.model.Trip> trips;
        if (driverId != null) {
            trips = tripService.listTripsByDriver(driverId);
        } else if (matricula != null) {
            trips = driverRepository.findByMatricula(matricula)
                    .map(d -> tripService.listTripsByDriver(d.getId()))
                    .orElse(List.of());
        } else {
            trips = tripService.listTrips();
        }

        List<TripDTO> response = trips.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/delay")
    public ResponseEntity<TripDTO> markDelayed(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.markDelayed(id)));
    }

    @PostMapping("/{id}/delay/clear")
    public ResponseEntity<TripDTO> clearDelay(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.clearDelay(id)));
    }

    @PatchMapping("/{id}/arrival")
    public ResponseEntity<TripDTO> updateArrivalTime(@PathVariable Long id, @RequestBody LocalDateTime actualArrival) {
        return ResponseEntity.ok(convertToDTO(tripService.updateArrivalTime(id, actualArrival)));
    }

    @PostMapping("/{id}/revert")
    public ResponseEntity<TripDTO> revertTrip(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.revertTrip(id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TripDTO> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.cancelTrip(id)));
    }

    @PostMapping
    public ResponseEntity<TripDTO> createTrip(@RequestBody Map<String, Object> payload) {
        Trip trip = new Trip();

        if (payload.get("driverId") != null) {
            Long driverId = Long.valueOf(payload.get("driverId").toString());
            driverRepository.findById(driverId).ifPresent(trip::setDriver);
        }

        if (payload.get("segmentId") != null) {
            Long segmentId = Long.valueOf(payload.get("segmentId").toString());
            segmentRepository.findById(segmentId).ifPresent(segment -> {
                trip.setSegment(segment);
                if (payload.get("serviceId") == null && segment.getService() != null) {
                    trip.setServiceId(segment.getService().getId());
                }
            });
        }

        if (payload.get("serviceId") != null) {
            trip.setServiceId(Long.valueOf(payload.get("serviceId").toString()));
        }

        if (payload.get("departureTime") != null) {
            trip.setDepartureTime(LocalDateTime.parse(payload.get("departureTime").toString()));
        }

        if (payload.get("vehicleId") != null) {
            Long vehicleId = Long.valueOf(payload.get("vehicleId").toString());
            vehicleRepository.findById(vehicleId).ifPresent(trip::setVehicle);
        }

        if (payload.get("status") != null) {
            trip.setStatus(com.vitae.api.model.TripStatus.valueOf(payload.get("status").toString().toUpperCase()));
        } else {
            trip.setStatus(com.vitae.api.model.TripStatus.SCHEDULED);
        }
        trip.setIsImpacted(false);

        return ResponseEntity.ok(convertToDTO(tripService.createTrip(trip)));
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<TripDTO> markNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.markNoShow(id)));
    }

    @PostMapping("/{id}/no-show/clear")
    public ResponseEntity<TripDTO> clearNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(convertToDTO(tripService.clearNoShow(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripDTO> updateTrip(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Trip tripUpdate = new Trip();

        if (payload.get("driverId") != null) {
            Long driverId = Long.valueOf(payload.get("driverId").toString());
            driverRepository.findById(driverId).ifPresent(tripUpdate::setDriver);
        }

        if (payload.get("segmentId") != null) {
            Long segmentId = Long.valueOf(payload.get("segmentId").toString());
            segmentRepository.findById(segmentId).ifPresent(segment -> {
                tripUpdate.setSegment(segment);
                if (payload.get("serviceId") == null && segment.getService() != null) {
                    tripUpdate.setServiceId(segment.getService().getId());
                }
            });
        }

        if (payload.get("serviceId") != null) {
            tripUpdate.setServiceId(Long.valueOf(payload.get("serviceId").toString()));
        }

        if (payload.get("departureTime") != null) {
            tripUpdate.setDepartureTime(LocalDateTime.parse(payload.get("departureTime").toString()));
        }

        if (payload.get("vehicleId") != null) {
            Long vehicleId = Long.valueOf(payload.get("vehicleId").toString());
            vehicleRepository.findById(vehicleId).ifPresent(tripUpdate::setVehicle);
        }

        if (payload.get("status") != null) {
            String statusStr = payload.get("status").toString().toUpperCase();
            tripUpdate.setStatus(com.vitae.api.model.TripStatus.valueOf(statusStr));
        }

        return ResponseEntity.ok(convertToDTO(tripService.updateTrip(id, tripUpdate)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }

    public TripDTO convertToDTO(Trip trip) {
        if (trip == null)
            return null;

        TripDTO.TripDTOBuilder builder = TripDTO.builder()
                .id(trip.getId())
                .serviceId(trip.getServiceId())
                .status(trip.getStatus())
                .isImpacted(trip.getIsImpacted())
                .hasRestViolation(trip.getHasRestViolation())
                .violationMessage(trip.getViolationMessage())
                .isDobra(trip.getIsDobra())
                .departureTime(trip.getDepartureTime())
                .arrivalTime(trip.getArrivalTime())
                .actualArrivalTime(trip.getActualArrivalTime())
                .updatedBy(trip.getUpdatedBy())
                .updatedAt(trip.getUpdatedAt());

        if (trip.getServiceId() != null) {
            serviceRepository.findById(trip.getServiceId()).ifPresent(srv -> {
                builder.serviceCode(srv.getCode());
                builder.routeName(srv.getName());
            });
        }

        if (trip.getSegment() != null) {
            TripDTO.SegmentDTO.SegmentDTOBuilder segBuilder = TripDTO.SegmentDTO.builder()
                    .id(trip.getSegment().getId())
                    .origin(trip.getSegment().getOrigin())
                    .destination(trip.getSegment().getDestination())
                    .sequence(trip.getSegment().getSequence())
                    .hasError(trip.getSegment().getHasError())
                    .errorMessage(trip.getSegment().getErrorMessage())
                    .errorReportedBy(trip.getSegment().getErrorReportedBy())
                    .errorReportedAt(trip.getSegment().getErrorReportedAt());

            if (trip.getSegment().getService() != null) {
                com.vitae.api.model.Service srv = trip.getSegment().getService();
                builder.serviceCode(srv.getCode());
                builder.routeName(srv.getName());
                segBuilder.totalSegments(segmentRepository.countByService(srv));
            }

            if (trip.getSegment().getBase() != null) {
                segBuilder.base(TripDTO.BaseDTO.builder()
                        .id(trip.getSegment().getBase().getId())
                        .name(trip.getSegment().getBase().getName())
                        .parentBaseId(trip.getSegment().getBase().getParentBaseId())
                        .build());
            }
            builder.segment(segBuilder.build());
        }

        if (trip.getDriver() != null) {
            builder.driver(TripDTO.DriverDTO.builder()
                    .id(trip.getDriver().getId())
                    .name(trip.getDriver().getName())
                    .matricula(trip.getDriver().getMatricula())
                    .build());
        }

        if (trip.getVehicle() != null) {
            builder.vehicle(TripDTO.VehicleDTO.builder()
                    .id(trip.getVehicle().getId())
                    .plate(trip.getVehicle().getPlate())
                    .prefix(trip.getVehicle().getPrefix())
                    .model(trip.getVehicle().getModel())
                    .build());
        }

        return builder.build();
    }
}
