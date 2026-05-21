package com.aiframework.service.aimodel;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AiModelNotFoundException extends RuntimeException {
    public AiModelNotFoundException(String message) {
        super(message);
    }
}
