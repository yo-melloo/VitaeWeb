package com.vitae.api.repository;

import com.vitae.api.model.Base;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BaseRepository extends JpaRepository<Base, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "users", "drivers" })
    java.util.List<Base> findAll();

    java.util.Optional<Base> findByName(String name);
}
