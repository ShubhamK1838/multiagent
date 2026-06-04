import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { TopNav, type View } from './components/layout/TopNav'
import { ChatWindow } from './components/chat/ChatWindow'
import { EventPanel } from './components/events/EventPanel'
import { ToolManager } from './components/tools/ToolManager'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { RAGPanel } from './components/rag/RAGPanel'
import { AiModelsPanel } from './components/aimodels/AiModelsPanel'
import { AgentRolesPanel } from './components/agents/AgentRolesPanel'
import { FormModal } from './components/forms/FormModal'
import { MemoryPanel } from './components/memory/MemoryPanel'
import { useConversations } from './hooks/useConversations'
import { useUiSettings } from './hooks/useUiSettings'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { BackgroundGrid } from './components/shared/BackgroundGrid'

// New Jarvis Imports
import { ThemeProvider as JarvisThemeProvider } from './contexts/ThemeContext'
import { SecurityProvider } from './contexts/SecurityContext'
import { JarvisHUDView } from './components/layout/JarvisHUDView'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}

function MainApp() {
  const [activeView, setActiveView] = useState<View>('chat')
  const { activeConversationId, createConversation } = useConversations()
  const { getBoolean } = useUiSettings()

  const showEventPanel = getBoolean('ui.activity_panel', true)

  const handleNewChat = async () => {
    await createConversation()
    setActiveView('chat')
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#020b18' }}>
        <ThemeProvider />
        <BackgroundGrid />
        <TopNav activeView={activeView} onChange={setActiveView} />

        <div className="flex-1 flex overflow-hidden">
          {activeView === 'chat' && <Sidebar onNewChat={handleNewChat} />}

          <main className="flex-1 flex overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.18 }}
                className="flex-1 flex overflow-hidden min-w-0"
              >
                {activeView === 'chat' && (
                  <>
                    <ChatWindow conversationId={activeConversationId} onNewChat={handleNewChat} />
                    <AnimatePresence>
                      {showEventPanel && (
                        <motion.div
                          key="event-panel"
                          initial={{ x: 320, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 320, opacity: 0 }}
                          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                          className="shrink-0"
                        >
                          <EventPanel conversationId={activeConversationId} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
                {activeView === 'models'   && <AiModelsPanel />}
                {activeView === 'agents'   && <AgentRolesPanel />}
                {activeView === 'tools'    && <ToolManager />}
                {activeView === 'memory'   && <MemoryPanel />}
                {activeView === 'settings' && <SettingsPanel />}
                {activeView === 'rag'      && <RAGPanel />}
                {activeView === 'hud'      && <JarvisHUDView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <FormModal />
      </div>
    </>
  )
}

export default function App() {
  return (
    <JarvisThemeProvider>
      <SecurityProvider>
        <MainApp />
      </SecurityProvider>
    </JarvisThemeProvider>
  )
}
