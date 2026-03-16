package com.vitae.api.controller;

import com.vitae.api.model.Vehicle;
import com.vitae.api.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @PostMapping
    public Vehicle createVehicle(@RequestBody Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicleDetails) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setPrefix(vehicleDetails.getPrefix());
            vehicle.setPlate(vehicleDetails.getPlate());
            vehicle.setModel(vehicleDetails.getModel());
            vehicle.setCapacity(vehicleDetails.getCapacity());
            vehicle.setStatus(vehicleDetails.getStatus());
            return ResponseEntity.ok(vehicleRepository.save(vehicle));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicleRepository.delete(vehicle);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
