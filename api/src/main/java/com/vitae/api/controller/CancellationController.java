package com.vitae.api.controller;

import com.vitae.api.service.CancellationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/cancellations")
@CrossOrigin(origins = "*")
public class CancellationController {

    @Autowired
    private CancellationService cancellationService;

    @PostMapping("/service/{serviceId}")
    public ResponseEntity<Void> cancelService(
            @PathVariable Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        cancellationService.cancelService(serviceId, start, end);
        return ResponseEntity.ok().build();
    }
}
