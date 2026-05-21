package com.aiframework.core.event;

public enum EventType {
    THINKING,
    TOOL_CALL,
    TOOL_RESULT,
    TOOL_ERROR,
    FORM_REQUEST,
    FORM_RESOLVED,
    TOKEN,
    STREAM_RESET,
    RESPONSE_START,
    RESPONSE_END,
    AGENT_START,
    AGENT_END,
    ERROR,
    ITERATION_START,
    ITERATION_END
}
