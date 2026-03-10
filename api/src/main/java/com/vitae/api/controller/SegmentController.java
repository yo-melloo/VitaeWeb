package com.vitae.api.controller;

import com.vitae.api.model.Segment;
import com.vitae.api.repository.SegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/segments")
@CrossOrigin(origins = "*")
public class SegmentController {

    @Autowired
    private SegmentRepository segmentRepository;

    @GetMapping
    public List<Segment> getAllSegments() {
        return segmentRepository.findAll();
    }

    @GetMapping("/service/{serviceId}")
    public List<Segment> getSegmentsByService(@PathVariable Long serviceId) {
        return segmentRepository.findByServiceIdOrderBySequenceAsc(serviceId);
    }

    @Autowired
    private com.vitae.api.repository.ServiceRepository serviceRepository;

    @PostMapping("/service/{serviceId}")
    public ResponseEntity<Segment> createSegment(@PathVariable Long serviceId, @RequestBody Segment segment) {
        return serviceRepository.findById(serviceId).map(service -> {
            segment.setService(service);

            if (segment.getSequence() != null) {
                // Shift existing segments down to make room
                List<Segment> existing = segmentRepository.findByServiceIdOrderBySequenceAsc(serviceId);
                for (Segment s : existing) {
                    if (s.getSequence() >= segment.getSequence()) {
                        s.setSequence(s.getSequence() + 1);
                        segmentRepository.save(s);
                    }
                }
            } else {
                long max = segmentRepository.findByServiceIdOrderBySequenceAsc(serviceId).size();
                segment.setSequence((int) max + 1);
            }

            Segment saved = segmentRepository.save(segment);
            normalizeSequences(serviceId, null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Segment> updateSegment(@PathVariable Long id, @RequestBody Segment segmentDetails) {
        return segmentRepository.findById(id).map(segment -> {
            Long serviceId = segment.getService().getId();
            boolean sequenceChanged = segmentDetails.getSequence() != null
                    && !segmentDetails.getSequence().equals(segment.getSequence());

            if (sequenceChanged) {
                int newSeq = segmentDetails.getSequence();
                int oldSeq = segment.getSequence();

                List<Segment> existing = segmentRepository.findByServiceIdOrderBySequenceAsc(serviceId);
                for (Segment s : existing) {
                    if (s.getId().equals(id))
                        continue;

                    if (newSeq < oldSeq) {
                        if (s.getSequence() >= newSeq && s.getSequence() < oldSeq) {
                            s.setSequence(s.getSequence() + 1);
                            segmentRepository.save(s);
                        }
                    } else {
                        if (s.getSequence() > oldSeq && s.getSequence() <= newSeq) {
                            s.setSequence(s.getSequence() - 1);
                            segmentRepository.save(s);
                        }
                    }
                }
                segment.setSequence(newSeq);
            }

            segment.setOrigin(segmentDetails.getOrigin());
            segment.setDestination(segmentDetails.getDestination());
            segment.setEstimatedDurationMinutes(segmentDetails.getEstimatedDurationMinutes());

            Segment saved = segmentRepository.save(segment);
            normalizeSequences(serviceId, null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSegment(@PathVariable Long id) {
        return segmentRepository.findById(id).map(segment -> {
            Long serviceId = segment.getService().getId();
            segmentRepository.delete(segment);
            normalizeSequences(serviceId, id);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void normalizeSequences(Long serviceId, Long ignoreId) {
        List<Segment> segments = segmentRepository.findByServiceIdOrderBySequenceAsc(serviceId);
        int seq = 1;
        for (Segment s : segments) {
            if (ignoreId != null && s.getId().equals(ignoreId))
                continue;
            s.setSequence(seq++);
            segmentRepository.save(s);
        }
    }
}
