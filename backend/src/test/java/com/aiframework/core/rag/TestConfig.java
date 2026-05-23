package com.aiframework.core.rag;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.mockito.Mockito;

@Configuration
public class TestConfig {

    @Bean(name = "ollamaEmbeddingModel")
    @Primary
    public EmbeddingModel ollamaEmbeddingModel() {
        return Mockito.mock(EmbeddingModel.class);
    }
}
