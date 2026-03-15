package com.vitae.api.controller;

import com.vitae.api.model.Driver;
import com.vitae.api.repository.DriverRepository;
import com.vitae.api.service.CirandaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private CirandaService cirandaService;

    @Autowired
    private com.vitae.api.service.DriverService driverService;

    @GetMapping
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @GetMapping("/suggest")
    public ResponseEntity<Driver> suggestNextDriver(
            @RequestParam String origin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTime) {

        Driver suggestedDriver = cirandaService.suggestNextDriver(origin, departureTime);
        if (suggestedDriver != null) {
            return ResponseEntity.ok(suggestedDriver);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping

    public Driver createDriver(@RequestBody Driver driver) {
        return driverRepository.save(driver);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        return driverRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driverDetails) {
        try {
            return ResponseEntity.ok(driverService.updateDriver(id, driverDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        return driverRepository.findById(id).map(driver -> {
            driverRepository.delete(driver);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/predict-sequence")
    public ResponseEntity<com.vitae.api.dto.DriverSequenceDTO> predictSequence(@PathVariable Long id) {
        return ResponseEntity.ok(cirandaService.getDriverSequencePrediction(id));
    }
}
