package com.aiframework.service.security;

import org.springframework.stereotype.Service;

@Service
public class DefaultSecurityProtocolService implements SecurityProtocolService {

    @Override
    public void activateHousePartyProtocol() {
        System.out.println("WARNING: HOUSE PARTY PROTOCOL ACTIVATED.");
        System.out.println("Locking all external ports...");
        System.out.println("Encrypting sensitive memory clusters...");
        // In a real app, this would disconnect websockets, flush caches, lock DB tables
    }

    @Override
    public void verifyClearance(String userId, int requiredLevel) {
        // Simulated check
        int userLevel = 1; // Default
        if ("admin".equals(userId)) userLevel = 5;

        if (userLevel < requiredLevel) {
            throw new SecurityException("Access Denied: Required Clearance Level " + requiredLevel);
        }
    }
}
