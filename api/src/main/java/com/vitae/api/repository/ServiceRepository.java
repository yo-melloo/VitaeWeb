package com.vitae.api.repository;

import com.vitae.api.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    java.util.List<Service> findAllByOutOfSequenceFalseOrderByCirandaSequenceAsc();
    java.util.Optional<Service> findByCode(String code);
}
