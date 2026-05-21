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
import { FormModal } from './components/forms/FormModal'
import { useConversations } from './hooks/useConversations'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('chat')
  const { activeConversationId, createConversation } = useConversations()

  const handleNewChat = async () => {
    await createConversation()
    setActiveView('chat')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950">
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
                  <EventPanel conversationId={activeConversationId} />
                </>
              )}
              {activeView === 'models'   && <AiModelsPanel />}
              {activeView === 'tools'    && <ToolManager />}
              {activeView === 'settings' && <SettingsPanel />}
              {activeView === 'rag'      && <RAGPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <FormModal />
    </div>
  )
}
