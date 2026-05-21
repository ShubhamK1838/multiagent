import React, { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { ChatWindow } from './components/chat/ChatWindow'
import { EventPanel } from './components/events/EventPanel'
import { ToolManager } from './components/tools/ToolManager'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { RAGPanel } from './components/rag/RAGPanel'
import { FormModal } from './components/forms/FormModal'
import { useConversations } from './hooks/useConversations'

type View = 'chat' | 'tools' | 'settings' | 'rag'

export default function App() {
  const [activeView, setActiveView] = useState<View>('chat')
  const { activeConversationId } = useConversations()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex overflow-hidden">
        {activeView === 'chat' && (
          <>
            <ChatWindow conversationId={activeConversationId} />
            <EventPanel conversationId={activeConversationId} />
          </>
        )}
        {activeView === 'tools' && <ToolManager />}
        {activeView === 'settings' && <SettingsPanel />}
        {activeView === 'rag' && <RAGPanel />}
      </main>

      <FormModal />
    </div>
  )
}
