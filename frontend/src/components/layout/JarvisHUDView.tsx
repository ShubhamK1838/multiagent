import React from 'react';
import { CommandCenter } from '../CommandCenter';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { ConversationalTerminal } from '../ConversationalTerminal';
import { MatrixLogStream } from '../MatrixLogStream';
import { ArcReactorMenu } from './ArcReactorMenu';
import { TickerTape } from '../TickerTape';
import { useTheme } from '../../contexts/ThemeContext';

export const JarvisHUDView: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className={`relative w-full h-full overflow-hidden ${theme === 'combat' ? 'bg-red-900/20' : 'bg-transparent'}`}>
            <CommandCenter />

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
                <DiagnosticsHUD />
                <ConversationalTerminal />
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-4">
                <MatrixLogStream />
            </div>

            <ArcReactorMenu />
            <TickerTape />
        </div>
    );
};
