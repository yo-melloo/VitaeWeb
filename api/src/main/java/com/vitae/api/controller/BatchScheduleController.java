package com.vitae.api.controller;

import com.vitae.api.dto.BatchScheduleRequest;
import com.vitae.api.model.Trip;
import com.vitae.api.service.BatchScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batch-schedules")
@CrossOrigin(origins = "*")
public class BatchScheduleController {

    @Autowired
    private BatchScheduleService batchScheduleService;

    @PostMapping("/generate")
    public ResponseEntity<List<Trip>> generateBatch(@RequestBody BatchScheduleRequest request) {
        List<Trip> trips = batchScheduleService.generateBatch(request);
        return ResponseEntity.ok(trips);
    }
}
