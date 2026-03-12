package com.vitae.api.service;

import com.vitae.api.model.Base;
import com.vitae.api.repository.BaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BaseService {

    @Autowired
    private BaseRepository baseRepository;

    public List<Base> getAllBases() {
        return baseRepository.findAll();
    }

    public Optional<Base> getBaseById(Long id) {
        return baseRepository.findById(id);
    }

    @Transactional
    public Base saveBase(Base base) {
        return baseRepository.save(base);
    }

    @Transactional
    public Base updateBase(Long id, Base details) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Base not found"));

        base.setName(details.getName());
        base.setManager(details.getManager());
        base.setType(details.getType());
        base.setParentBaseId(details.getParentBaseId());

        return baseRepository.save(base);
    }

    @Transactional
    public void deleteBase(Long id) {
        baseRepository.deleteById(id);
    }
}
