package com.aiframework.controller.dto;

import lombok.Data;

@Data
public class VisionRequest {
    private String imageBase64;
    private String uiState;
    private String intent;
}
