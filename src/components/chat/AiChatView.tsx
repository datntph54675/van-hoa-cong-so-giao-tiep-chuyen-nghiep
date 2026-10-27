import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatFeedback } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';

interface AiChatViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AiChatView: React.FC<AiChatViewProps> = ({ onShowToast }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    StorageService.getChatMessages()
  );
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Feedback modal state
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike'>('like');
  const [feedbackComment, setFeedbackComment] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    'Làm sao để từ chối sếp khéo léo khi bị quá tải?',
    'Cách viết email xin lỗi đối tác vì chậm tiến độ',
    'Làm thế nào để góp ý đồng nghiệp hay trễ deadline?',
    'Quy chuẩn trang phục Business Casual chuẩn mực gồm những gì?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    StorageService.saveChatMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-6)
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi phản hồi từ máy chủ AI.');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: data.reply || 'Xin lỗi, tôi chưa thể trả lời lúc này.',
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      StorageService.saveChatMessages(finalMessages);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text:
          'Hệ thống đang gặp gián đoạn tạm thời. Tuy nhiên, theo cẩm nang văn hóa công sở: Khi gặp tình huống khó, bạn hãy giữ thái độ bình tĩnh, lắng nghe thấu cảm và áp dụng mô hình SBI hoặc BLUF để xử lý nhé!',
        timestamp: Date.now()
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      StorageService.saveChatMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFeedback = (messageId: string, rating: 'like' | 'dislike') => {
    setActiveFeedbackMsgId(messageId);
    setFeedbackRating(rating);
    setFeedbackComment('');
  };

  const handleSubmitFeedback = async () => {
    if (!activeFeedbackMsgId) return;

    const feedbackObj: ChatFeedback = {
      id: 'fb-' + Date.now(),
      messageId: activeFeedbackMsgId,
      rating: feedbackRating,
      comment: feedbackComment,
      timestamp: Date.now()
    };

    // Save locally
    StorageService.saveChatFeedback(feedbackObj);

    // Update message state
    setMessages((prev) =>
      prev.map((m) =>
        m.id === activeFeedbackMsgId
          ? { ...m, feedback: feedbackRating, feedbackComment }
          : m
      )
    );

    // Try posting to API
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackObj)
      });
    } catch (e) {
      console.warn('Feedback API call:', e);
    }

    onShowToast(
      'Gửi phản hồi thành công!',
      'Cảm ơn bạn đã đóng góp ý kiến để hoàn thiện Trợ lý AI.',
      'success'
    );

    setActiveFeedbackMsgId(null);
    setFeedbackComment('');
  };

  const handleClearHistory = () => {
    const defaultMsg: ChatMessage[] = [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Xin chào bạn! Tôi là Trợ lý AI Cố vấn Văn hóa & Giao tiếp Công sở. Bạn có thể hỏi tôi về cách ứng xử với cấp trên, đồng nghiệp, khách hàng, mẫu email chuẩn hoặc cách xử lý các tình huống khó khăn trong công việc.',
        timestamp: Date.now()
      }
    ];
    setMessages(defaultMsg);
    StorageService.saveChatMessages(defaultMsg);
    onShowToast('Đã làm mới cuộc hội thoại', undefined, 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-blue-200" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Trợ lý AI Cố vấn Văn hóa & Giao tiếp Công sở
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 ml-10">
            Được huấn luyện theo toàn bộ cẩm nang 10 bài học, mô hình SBI, BLUF và quy chuẩn giao tiếp chuyên nghiệp.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm mới hội thoại</span>
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Gợi ý câu hỏi thường gặp:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200/80 rounded-lg px-3 py-1.5 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col h-[520px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-blue-900 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-blue-300" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1.5">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-blue-900 text-white rounded-tr-xs'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Feedback controls on assistant messages */}
                  {!isUser && msg.id !== 'msg-welcome' && (
                    <div className="flex items-center gap-2 text-xs text-slate-700 pl-1">
                      <span>Câu trả lời hữu ích?</span>
                      <button
                        onClick={() => handleOpenFeedback(msg.id, 'like')}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                          msg.feedback === 'like' ? 'text-emerald-600 font-bold' : ''
                        }`}
                        title="Hữu ích"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenFeedback(msg.id, 'dislike')}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                          msg.feedback === 'dislike' ? 'text-rose-600 font-bold' : ''
                        }`}
                        title="Chưa hài lòng"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      {msg.feedback && (
                        <span className="text-[11px] text-emerald-800 font-medium">
                          ✓ Đã ghi nhận phản hồi
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-blue-300 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <span>Cố vấn AI đang suy nghĩ câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Đặt câu hỏi về văn hóa công sở, mẫu email, cách ứng xử..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shrink-0"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Feedback Modal Dialog */}
      {activeFeedbackMsgId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Đóng góp ý kiến về câu trả lời của AI
              </h3>
              <button
                onClick={() => setActiveFeedbackMsgId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackRating('like')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    feedbackRating === 'like'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Hữu ích, chuẩn xác</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackRating('dislike')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    feedbackRating === 'dislike'
                      ? 'border-rose-500 bg-rose-50 text-rose-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Chưa phù hợp</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ý kiến bổ sung hoặc góp ý hoàn thiện (Tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Ví dụ: Câu trả lời rất thực tế; hoặc: Cần bổ sung thêm ví dụ mẫu email..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveFeedbackMsgId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Gửi góp ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
