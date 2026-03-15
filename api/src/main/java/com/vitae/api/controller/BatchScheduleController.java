package com.vitae.api.controller;

import com.vitae.api.dto.BatchScheduleRequest;
import com.vitae.api.dto.TripDTO;
import com.vitae.api.model.Trip;
import com.vitae.api.service.BatchScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/batch-schedules")
@CrossOrigin(origins = "*")
public class BatchScheduleController {

    @Autowired
    private BatchScheduleService batchScheduleService;

    @Autowired
    private TripController tripController;

    @CrossOrigin(origins = "*")
    @PostMapping(value = "/generate", consumes = "application/json", produces = "application/json")
    public ResponseEntity<List<TripDTO>> generateBatch(@RequestBody BatchScheduleRequest request) {
        List<Trip> trips = batchScheduleService.generateBatch(request);
        List<TripDTO> dtos = trips.stream()
                .map(tripController::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @CrossOrigin(origins = "*")
    @PostMapping(value = "/generate/all", consumes = "application/json", produces = "application/json")
    public ResponseEntity<List<TripDTO>> generateAll(@RequestBody BatchScheduleRequest request) {
        List<Trip> trips = batchScheduleService.generateAllSequenced(
                request.getStartDate(),
                request.getEndDate(),
                request.getDefaultDepartureTime());
        List<TripDTO> dtos = trips.stream()
                .map(tripController::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
