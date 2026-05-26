package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class LaunchApplicationHandler implements ToolHandler {

    private static final Pattern SAFE_APP_NAME = Pattern.compile("^[\\w\\s.\\-]+$");

    @Override
    public String handlerName() {
        return "launch_application";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String appName = (String) args.get("app_name");
        if (appName == null || appName.isBlank()) {
            return ToolExecutionResult.error("Parameter 'app_name' is required");
        }

        if (!SAFE_APP_NAME.matcher(appName).matches()) {
            return ToolExecutionResult.error("Invalid application name — only alphanumeric characters, spaces, dots and hyphens are allowed");
        }

        try {
            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb;
            if (os.contains("win")) {
                pb = new ProcessBuilder("cmd", "/c", "start", "", appName);
            } else if (os.contains("mac")) {
                pb = new ProcessBuilder("open", "-a", appName);
            } else {
                pb = new ProcessBuilder(appName);
            }

            pb.start();
            return ToolExecutionResult.success("Launched: " + appName);
        } catch (IOException e) {
            return ToolExecutionResult.error("Failed to launch '" + appName + "': " + e.getMessage());
        }
    }
}
