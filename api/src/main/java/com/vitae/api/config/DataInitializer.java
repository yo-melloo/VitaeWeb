package com.vitae.api.config;

import com.vitae.api.model.*;
import com.vitae.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

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

        @Autowired
        private SegmentRepository segmentRepository;

        @Override
        public void run(String... args) throws Exception {
                if (userRepository.count() == 0) {
                        List<Base> bases = seedBases();
                        Base goiania = bases.get(0);
                        Base imperatriz = bases.get(2);

                        seedUsers(goiania, imperatriz);
                        Service service2261 = seedServices();
                        seedDrivers(goiania);
                        seedVehicles();
                        seedSegments(service2261, goiania, imperatriz);
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

        private List<Base> seedBases() {
                Base b1 = Base.builder().name("GOIÂNIA").manager("Ricardo").build();
                Base b2 = Base.builder().name("SÃO LUÍS").manager("Ana").build();
                Base b3 = Base.builder().name("IMPERATRIZ").manager("Marcos").build();
                return baseRepository.saveAll(Arrays.asList(b1, b2, b3));
        }

        private Service seedServices() {
                Service s1 = Service.builder()
                                .code("2261")
                                .name("Goiânia x São Luís")
                                .build(); // Default: All days

                Service s2 = Service.builder()
                                .code("2103")
                                .name("Expresso Regional")
                                .operationalDays(java.util.EnumSet
                                                .complementOf(java.util.EnumSet.of(java.time.DayOfWeek.SUNDAY)))
                                .build();

                Service s3 = Service.builder()
                                .code("2260")
                                .name("Linha Litorânea")
                                .operationalDays(java.util.EnumSet
                                                .complementOf(java.util.EnumSet.of(java.time.DayOfWeek.MONDAY)))
                                .build();

                Service s4 = Service.builder()
                                .code("4098")
                                .name("Reforço Fim de Semana")
                                .operationalDays(java.util.EnumSet.of(java.time.DayOfWeek.FRIDAY))
                                .build();

                serviceRepository.saveAll(Arrays.asList(s1, s2, s3, s4));
                return s1;
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
                driverRepository.saveAll(Arrays.asList(d1, d2));
        }

        private void seedVehicles() {
                Vehicle v1 = Vehicle.builder()
                                .plate("ABC-1234")
                                .model("Scania G-230")
                                .status(Vehicle.VehicleStatus.AVAILABLE)
                                .build();
                vehicleRepository.save(v1);
        }

        private void seedSegments(Service service, Base goiania, Base imperatriz) {
                Segment t1 = Segment.builder()
                                .service(service)
                                .origin("Imperatriz")
                                .destination("Santa Inês")
                                .estimatedDurationMinutes(180)
                                .sequence(1)
                                .base(imperatriz)
                                .build();
                Segment t2 = Segment.builder()
                                .service(service)
                                .origin("Santa Inês")
                                .destination("São Luís")
                                .estimatedDurationMinutes(240)
                                .sequence(2)
                                .base(goiania) // Simulating a GYN segment in the same service
                                .build();
                segmentRepository.saveAll(Arrays.asList(t1, t2));
        }
}
