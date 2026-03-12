package com.vitae.api.controller;

import com.vitae.api.model.Base;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bases")
@CrossOrigin(origins = "*")
public class BaseController {

    @Autowired
    private com.vitae.api.service.BaseService baseService;

    @GetMapping
    public List<Base> getAllBases() {
        return baseService.getAllBases();
    }

    @GetMapping("/{id}")
    public Base getBaseById(@PathVariable Long id) {
        return baseService.getBaseById(id)
                .orElseThrow(() -> new RuntimeException("Base not found"));
    }

    @PostMapping
    public Base createBase(@RequestBody Base base) {
        return baseService.saveBase(base);
    }

    @PutMapping("/{id}")
    public Base updateBase(@PathVariable Long id, @RequestBody Base base) {
        return baseService.updateBase(id, base);
    }

    @DeleteMapping("/{id}")
    public void deleteBase(@PathVariable Long id) {
        baseService.deleteBase(id);
    }
}
