package com.aiframework.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FormSchemaService {

    private final ObjectMapper objectMapper;

    public List<String> validate(Map<String, Object> schema) {
        List<String> errors = new ArrayList<>();

        if (schema == null) {
            errors.add("Schema must not be null");
            return errors;
        }

        String type = (String) schema.get("type");
        if (!"object".equals(type)) {
            errors.add("Root schema type must be 'object'");
        }

        Object properties = schema.get("properties");
        if (!(properties instanceof Map)) {
            errors.add("Schema must contain a 'properties' object");
        }

        return errors;
    }

    public boolean isValid(Map<String, Object> schema) {
        return validate(schema).isEmpty();
    }

    public Map<String, Object> normalize(Map<String, Object> schema) {
        if (!schema.containsKey("type")) {
            schema.put("type", "object");
        }
        return schema;
    }
}
