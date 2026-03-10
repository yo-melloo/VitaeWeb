package com.vitae.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI vitaeOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Vitae Web API")
                        .description("Backend for Vitae Web - Bus Routing & Scheduling System")
                        .version("v0.0.1")
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")));
    }
}
