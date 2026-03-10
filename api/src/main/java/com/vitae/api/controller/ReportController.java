package com.vitae.api.controller;

import com.vitae.api.model.Trip;
import com.vitae.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private TripRepository tripRepository;

    @GetMapping("/driver/{driverId}")
    public List<Trip> getDriverSchedule(@PathVariable Long driverId) {
        return tripRepository.findByDriverIdOrderByDepartureTimeAsc(driverId);
    }
}
