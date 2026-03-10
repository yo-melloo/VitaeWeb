package com.vitae.api.repository;

import com.vitae.api.model.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SegmentRepository extends JpaRepository<Segment, Long> {
    List<Segment> findByServiceIdOrderBySequenceAsc(Long serviceId);

    long countByService(com.vitae.api.model.Service service);
}
