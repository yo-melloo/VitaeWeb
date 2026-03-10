package com.vitae.api.controller;

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
import java.util.HashMap;
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
    public ResponseEntity<List<Map<String, Object>>> listTrips(
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

        List<Map<String, Object>> response = trips.stream().map(trip -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", trip.getId());
            dto.put("serviceId", trip.getServiceId());

            if (trip.getServiceId() != null) {
                serviceRepository.findById(trip.getServiceId()).ifPresent(srv -> {
                    dto.put("serviceCode", srv.getCode());
                    dto.put("routeName", srv.getName());
                });
            }

            dto.put("status", trip.getStatus());
            dto.put("isImpacted", trip.getIsImpacted());
            dto.put("departureTime", trip.getDepartureTime());
            dto.put("arrivalTime", trip.getArrivalTime());
            dto.put("actualArrivalTime", trip.getActualArrivalTime());

            if (trip.getSegment() != null) {
                Map<String, Object> segmentDto = new HashMap<>();
                segmentDto.put("origin", trip.getSegment().getOrigin());
                segmentDto.put("destination", trip.getSegment().getDestination());
                segmentDto.put("sequence", trip.getSegment().getSequence());

                if (trip.getSegment().getService() != null) {
                    com.vitae.api.model.Service srv = trip.getSegment().getService();
                    dto.put("serviceCode", srv.getCode());
                    dto.put("routeName", srv.getName());
                    long total = segmentRepository.countByService(srv);
                    segmentDto.put("totalSegments", total);
                }

                dto.put("segment", segmentDto);
            }

            if (trip.getDriver() != null) {
                Map<String, Object> driver = new HashMap<>();
                driver.put("id", trip.getDriver().getId());
                driver.put("name", trip.getDriver().getName());
                driver.put("matricula", trip.getDriver().getMatricula());
                dto.put("driver", driver);
            }

            if (trip.getVehicle() != null) {
                Map<String, Object> vehicle = new HashMap<>();
                vehicle.put("id", trip.getVehicle().getId());
                vehicle.put("plate", trip.getVehicle().getPlate());
                vehicle.put("prefix", trip.getVehicle().getPrefix());
                vehicle.put("model", trip.getVehicle().getModel());
                dto.put("vehicle", vehicle);
            }

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/delay")
    public ResponseEntity<Trip> markDelayed(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.markDelayed(id));
    }

    @PostMapping("/{id}/delay/clear")
    public ResponseEntity<Trip> clearDelay(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.clearDelay(id));
    }

    @PatchMapping("/{id}/arrival")
    public ResponseEntity<Trip> updateArrivalTime(@PathVariable Long id, @RequestBody LocalDateTime actualArrival) {
        return ResponseEntity.ok(tripService.updateArrivalTime(id, actualArrival));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Trip> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@RequestBody Map<String, Object> payload) {
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

        return ResponseEntity.ok(tripService.createTrip(trip));
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<Trip> markNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.markNoShow(id));
    }

    @PostMapping("/{id}/no-show/clear")
    public ResponseEntity<Trip> clearNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.clearNoShow(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
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

        return ResponseEntity.ok(tripService.updateTrip(id, tripUpdate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }
}
