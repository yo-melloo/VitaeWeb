package com.vitae.api.config;

import com.vitae.api.model.*;
import com.vitae.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BaseRepository baseRepository;

    @Autowired
    private ServiceRepository serviceRepository;



    @Override
    public void run(String... args) throws Exception {
        // Seed Bases
        Base goiania = baseRepository.findByName("GOIÂNIA").orElseGet(() -> 
            baseRepository.save(Base.builder().name("GOIÂNIA").manager("Ricardo").type(Base.BaseType.OPERACIONAL).build()));
        
        Base imperatriz = baseRepository.findByName("IMPERATRIZ").orElseGet(() -> 
            baseRepository.save(Base.builder().name("IMPERATRIZ").manager("Marcos").type(Base.BaseType.OPERACIONAL).build()));

        baseRepository.findByName("SÃO LUÍS").orElseGet(() -> 
            baseRepository.save(Base.builder().name("SÃO LUÍS").manager("Ana").type(Base.BaseType.OPERACIONAL).build()));

        // Seed Users
        seedUsers(goiania, imperatriz);

        // Seed basic services if none exist
        if (serviceRepository.count() == 0) {
            seedServices();
        }

        // Seed basic drivers if none exist
        if (driverRepository.count() == 0) {
            seedDrivers(imperatriz);
        }

        // Seed basic vehicles if none exist
        if (vehicleRepository.count() == 0) {
            seedVehicles();
        }
    }

    private void seedUsers(Base goiania, Base imperatriz) {
        if (userRepository.findByMatricula("0001").isEmpty()) {
            User admin = User.builder()
                    .matricula("0001")
                    .password("admin123")
                    .fullName("System Admin")
                    .profile(User.UserProfile.ADMIN)
                    .status(User.UserStatus.APPROVED)
                    .build();
            userRepository.save(admin);
        }

        if (userRepository.findByMatricula("0002").isEmpty()) {
            User operator = User.builder()
                    .matricula("0002")
                    .password("op123")
                    .fullName("Operator GYN")
                    .profile(User.UserProfile.OPERATOR)
                    .base(goiania)
                    .status(User.UserStatus.APPROVED)
                    .build();
            userRepository.save(operator);
        }

        if (userRepository.findByMatricula("0003").isEmpty()) {
            User operatorIMP = User.builder()
                    .matricula("0003")
                    .password("imp123")
                    .fullName("Operator IMP")
                    .profile(User.UserProfile.OPERATOR)
                    .base(imperatriz)
                    .status(User.UserStatus.APPROVED)
                    .build();
            userRepository.save(operatorIMP);
        }

        if (userRepository.findByMatricula("1001").isEmpty()) {
            User driver = User.builder()
                    .matricula("1001")
                    .password("driver123")
                    .fullName("CARLOS ALBERTO")
                    .profile(User.UserProfile.DRIVER)
                    .base(goiania)
                    .status(User.UserStatus.APPROVED)
                    .build();
            userRepository.save(driver);
        }
    }

    private void seedServices() {
        Service s1 = Service.builder().code("2261").name("SLZ x GYN (Operação Dupla)").isDoubleDriven(true).build();
        Service s2 = Service.builder().code("2103").name("Expresso Regional (Solo)").isDoubleDriven(false).build();
        Service s3 = Service.builder().code("1072").name("IMP x GYN (Operação Dupla)").isDoubleDriven(true).build();
        serviceRepository.saveAll(Arrays.asList(s1, s2, s3));
    }

    private void seedDrivers(Base base) {
        Driver d1 = Driver.builder()
                .name("CARLOS ALBERTO")
                .matricula("1001")
                .base(base)
                .status(Driver.DriverStatus.DISPONIVEL)
                .saldoDias(0)
                .build();
        Driver d2 = Driver.builder()
                .name("MARIANA SILVA")
                .matricula("1002")
                .base(base)
                .status(Driver.DriverStatus.DISPONIVEL)
                .saldoDias(2)
                .build();
        Driver d3 = Driver.builder()
                .name("JOÃO RICARDO")
                .matricula("1003")
                .base(base)
                .status(Driver.DriverStatus.FOLGA)
                .lastStatusChange(java.time.LocalDateTime.now().minusHours(40)) // Simula reset de 36h
                .saldoDias(5)
                .build();
        driverRepository.saveAll(Arrays.asList(d1, d2, d3));
    }

    private void seedVehicles() {
        Vehicle v1 = Vehicle.builder()
                .plate("ABC-1234")
                .prefix("1234")
                .model("Scania G-230")
                .status(Vehicle.VehicleStatus.AVAILABLE)
                .build();
        vehicleRepository.save(v1);
    }
}
