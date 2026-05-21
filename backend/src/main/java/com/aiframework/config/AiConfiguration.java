package com.aiframework.config;

import org.springframework.context.annotation.Configuration;

/**
 * Chat clients are now built dynamically from the AI model registry — see
 * {@code ChatClientProvider}. No static ChatClient bean is defined here so that
 * model switching at runtime does not require a context reload.
 */
@Configuration
public class AiConfiguration {
}
