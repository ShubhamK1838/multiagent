import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SecurityContextType {
    clearanceLevel: number;
    setClearanceLevel: (level: number) => void;
    housePartyProtocolActive: boolean;
    activateHousePartyProtocol: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clearanceLevel, setClearanceLevel] = useState<number>(1);
    const [housePartyProtocolActive, setHousePartyProtocolActive] = useState(false);

    const activateHousePartyProtocol = () => {
        setHousePartyProtocolActive(true);
        // Additional lockdown logic here
    };

    return (
        <SecurityContext.Provider value={{ clearanceLevel, setClearanceLevel, housePartyProtocolActive, activateHousePartyProtocol }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
};
