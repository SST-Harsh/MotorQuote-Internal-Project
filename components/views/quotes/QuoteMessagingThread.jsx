'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Clock, MessageSquare, ShieldAlert } from 'lucide-react';
import quoteService from '@/services/quoteService';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function QuoteMessagingThread({
  quoteId,
  isDealer,
  currentUserId,
  currentUserRole,
  sellerUserId,
  onMessagesLoaded,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const scrollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quoteService.getCommunicationLogs(quoteId, {
        _useDealerEndpoint: isDealer,
      });
      const logs = data || [];
      const sorted = [...logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sorted);

      // Find latest proposed amount to sync with UI
      let latestProposedAmount = null;
      for (let i = sorted.length - 1; i >= 0; i--) {
        const msg = sorted[i];
        if (msg.type === 'comment' || msg.type === 'proposal') {
          try {
            const content =
              typeof msg.content === 'string' && msg.content.startsWith('{')
                ? JSON.parse(msg.content)
                : msg.parsed_content || null;

            if (content && content.proposed_amount) {
              latestProposedAmount = Number(content.proposed_amount);
              break;
            }
          } catch (e) {
            /* Not a JSON proposal */
          }
        }
      }

      if (onMessagesLoaded) {
        onMessagesLoaded(sorted.length, latestProposedAmount);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [quoteId, isDealer, onMessagesLoaded]);

  useEffect(() => {
    fetchMessages();
    // Setup polling for real-time feel if needed
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await quoteService.addCommunicationLog(quoteId, {
        communication_type: 'message',
        direction: 'outbound',
        subject: 'Chat Message',
        message: newMessage,
        _useDealerEndpoint: isDealer,
      });
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const normalizeRole = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[_\s]/g, '');
  const roleLabel = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === 'dealermanager') return 'Dealer Manager';
    if (normalized === 'superadmin') return 'Super Admin';
    if (normalized === 'supportstaff') return 'Support';
    if (normalized === 'seller') return 'Seller';
    if (normalized === 'dealer') return 'Dealer';
    return '';
  };

  return (
    <section className="flex flex-col h-full overflow-hidden">
      {/* <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-[rgb(var(--color-primary))]" />
                    <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">Quote Messaging</h3>
                </div>
                {loading && <span className="text-[10px] text-[rgb(var(--color-text-muted))] animate-pulse">Syncing...</span>}
            </div> */}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6 bg-gray-50/50 dark:bg-gray-900/10 scroll-smooth"
      >
        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] flex items-center justify-center mb-4 text-[rgb(var(--color-text-muted))]/20">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm text-[rgb(var(--color-text-muted))] font-medium">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const senderId = msg.user_id || msg.sent_by || msg.created_by || msg.sender_id;
            const senderName =
              msg.user_name || msg.sent_by_name || msg.created_by_name || msg.sender_name;
            const senderRoleRaw =
              msg.user_role || msg.role || msg.sent_by_role || msg.created_by_role;
            const isMe = String(senderId || '') === String(currentUserId || '');

            // Detect price proposal content
            let priceProposal = null;
            if (msg.type === 'comment' || msg.type === 'proposal') {
              try {
                const content =
                  typeof msg.content === 'string' && msg.content.startsWith('{')
                    ? JSON.parse(msg.content)
                    : msg.parsed_content || null;

                if (content && content.proposed_amount) {
                  priceProposal = content;
                }
              } catch (e) {
                // Not a JSON proposal
              }
            }

            let inferredRole = senderRoleRaw || priceProposal?.proposed_by_role || '';
            if (!inferredRole && senderId && String(senderId) === String(sellerUserId || '')) {
              inferredRole = 'seller';
            }
            if (!inferredRole && isMe && currentUserRole) {
              inferredRole = currentUserRole;
            }
            if (!inferredRole && senderId) {
              inferredRole = normalizeRole(user?.role) === 'seller' ? 'dealer_manager' : 'seller';
            }
            const senderRoleLabel = roleLabel(inferredRole);
            const isSystemNote = msg.type === 'note' && !senderId;

            if (isSystemNote) {
              return (
                <div key={index} className="flex justify-center my-2">
                  <div className="bg-[rgb(var(--color-background))] px-4 py-1.5 rounded-full border border-[rgb(var(--color-border))] shadow-sm">
                    <p className="text-[11px] font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2 uppercase tracking-tight">
                      <Clock size={12} />
                      {msg.message || msg.content} - {dayjs(msg.created_at).fromNow()}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Header: Role/Name + Time */}
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${isMe ? 'text-[rgb(var(--color-text-muted))]' : 'text-[rgb(var(--color-primary))]'}`}
                    >
                      <User size={12} />
                      {senderName || senderRoleLabel || 'User'}
                      {senderRoleLabel ? (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider border ${isMe ? 'border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))]' : 'border-[rgb(var(--color-primary))]/30 text-[rgb(var(--color-primary))]'}`}
                        >
                          {senderRoleLabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-medium">
                      {dayjs(msg.created_at).format('hh:mm A')}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`
                                        relative group shadow-sm transition-all duration-200
                                        ${
                                          isMe
                                            ? 'bg-[rgb(var(--color-primary))] text-white rounded-2xl rounded-tr-none'
                                            : 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-2xl rounded-tl-none'
                                        }
                                    `}
                  >
                    {priceProposal ? (
                      <div
                        className={`p-4 sm:min-w-[280px] space-y-3 ${isMe ? 'text-white' : 'text-[rgb(var(--color-text))]'}`}
                      >
                        <div className="flex items-center justify-between border-b border-white/20 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                            Price Proposal
                          </span>
                          <div className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">
                            UPDATED
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] opacity-70">Proposed Amount</p>
                          <p className="text-2xl font-black tabular-nums">
                            ${Number(priceProposal.proposed_amount).toLocaleString()}
                          </p>
                        </div>
                        {priceProposal.message && (
                          <p className="text-sm italic opacity-90 border-t border-white/10 pt-2">
                            &quot;{priceProposal.message}&quot;
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[10px] opacity-60 font-medium">
                          <User size={10} />
                          Proposed by{' '}
                          {roleLabel(priceProposal.proposed_by_role) ||
                            priceProposal.proposed_by_role ||
                            'User'}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message || msg.content}
                      </div>
                    )}
                  </div>

                  {/* Footer: Detailed relative time on hover */}
                  <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-[rgb(var(--color-text-muted))] font-medium italic">
                      {dayjs(msg.created_at).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isSuperAdmin ? (
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))]"
        >
          <div className="relative flex items-center gap-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[rgb(var(--color-primary))/0.15] focus-within:border-[rgb(var(--color-primary))] transition-all shadow-inner">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))]/60"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-[rgb(var(--color-primary))] text-white p-2.5 rounded-xl hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-[rgb(var(--color-background))] border-t border-[rgb(var(--color-border))] flex items-center justify-center gap-2 text-[rgb(var(--color-text-muted))]">
          <ShieldAlert size={16} />
          <span className="text-xs font-medium">Read-only mode for Super Admin</span>
        </div>
      )}
    </section>
  );
}
