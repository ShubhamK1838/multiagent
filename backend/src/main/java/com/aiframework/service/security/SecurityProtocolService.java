package com.aiframework.service.security;

public interface SecurityProtocolService {
    void activateHousePartyProtocol();
    void verifyClearance(String userId, int requiredLevel);
}
