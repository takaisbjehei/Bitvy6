import React, { useEffect, useState, useRef } from 'react';
import { supabase, sendChatMessage } from '../../services/supabase';
import { ChatMessage, LocalPlayerState } from '../../types';

interface ChatProps {
  localPlayer: LocalPlayerState;
}

const Chat: React.FC<ChatProps> = ({ localPlayer }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch (optional, usually chat is ephemeral in games, but we can fetch last 20)
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setMessages(data.reverse() as ChatMessage[]);
    };

    fetchRecent();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Optimistic update not strictly needed for chat but feels better? 
    // Actually we wait for realtime echo to confirm consistency.
    await sendChatMessage(localPlayer.id, localPlayer.username, input.trim());
    setInput('');
  };

  return (
    <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col h-64">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id || Math.random()} className="text-sm break-words">
            <span 
              className="font-bold mr-2" 
              style={{ color: msg.username === localPlayer.username ? '#34d399' : '#60a5fa' }}
            >
              {msg.username}:
            </span>
            <span className="text-gray-200">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-2 bg-white/5 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Press Enter to chat..."
          className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
          maxLength={200}
        />
      </form>
    </div>
  );
};

export default Chat;
