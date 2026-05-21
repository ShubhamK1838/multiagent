package com.aiframework.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * During active development, migration files are frequently re-edited after
 * being applied, which makes Flyway refuse to start with a checksum mismatch.
 * This strategy runs {@code repair()} before {@code migrate()} so the schema
 * history is realigned with the current file contents on every startup.
 *
 * <p>Repair only rewrites the schema-history checksums; it does not re-execute
 * migrations or change schema content. For production, remove this bean and
 * rely on default validation.
 */
@Slf4j
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            try {
                flyway.repair();
            } catch (Exception e) {
                log.warn("Flyway repair before migrate failed (continuing): {}", e.getMessage());
            }
            flyway.migrate();
        };
    }
}
