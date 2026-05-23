package com.aiframework;

import java.net.URL;
import java.net.URLClassLoader;

public class FindMedia {
    public static void main(String[] args) {
        String[] possiblePackages = {
            "org.springframework.ai.chat.messages.Media",
            "org.springframework.ai.model.Media",
            "org.springframework.ai.content.Media",
            "org.springframework.ai.Media"
        };
        for (String pkg : possiblePackages) {
            try {
                Class<?> cls = Class.forName(pkg);
                System.out.println("FOUND MEDIA: " + cls.getName());
                return;
            } catch (ClassNotFoundException e) {
                // Ignore
            }
        }
        System.out.println("Media class NOT FOUND in any known packages.");
    }
}
