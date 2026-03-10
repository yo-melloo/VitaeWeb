package com.vitae.api.controller;

import com.vitae.api.model.User;
import com.vitae.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vitae.api.dto.LoginRequest;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByMatricula(loginRequest.getMatricula());

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.ok(userOpt.get());
        }

        return ResponseEntity.status(401).build(); // Unauthorized
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setFullName(userDetails.getFullName());
            user.setMatricula(userDetails.getMatricula());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
                user.setPassword(userDetails.getPassword());
            }
            user.setProfile(userDetails.getProfile());
            user.setStatus(userDetails.getStatus());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody User.UserProfile newProfile) {
        return userRepository.findById(id).map(user -> {
            user.setProfile(newProfile);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody String newPassword) {
        return userRepository.findById(id).map(user -> {
            user.setPassword(newPassword);
            userRepository.save(user);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile-name")
    public ResponseEntity<User> updateProfileName(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setFullName(userDetails.getFullName());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }
}
