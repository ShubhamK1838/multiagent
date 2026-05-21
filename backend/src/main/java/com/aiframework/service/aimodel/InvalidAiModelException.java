package com.aiframework.service.aimodel;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidAiModelException extends RuntimeException {
    public InvalidAiModelException(String message) {
        super(message);
    }
}
