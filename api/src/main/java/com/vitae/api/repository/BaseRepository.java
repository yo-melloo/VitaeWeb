package com.vitae.api.repository;

import com.vitae.api.model.Base;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BaseRepository extends JpaRepository<Base, Long> {
    java.util.Optional<Base> findByName(String name);
}
