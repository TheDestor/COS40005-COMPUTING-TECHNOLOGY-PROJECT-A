import React, { useState, useRef, useEffect } from 'react';
import '../styles/AiChatbot.css';
import { IoIosSend, IoIosArrowDown } from "react-icons/io";
import { RxCross1, RxReset } from "react-icons/rx";
import { RiRobot2Fill } from "react-icons/ri";
import AiLogo from '../assets/AiLogo.gif';

const API_ENDPOINT = '/api/ai/chat';
const MODEL = 'deepseek/deepseek-chat-v3.1:free';
// const MODEL = 'deepseek/deepseek-r1-0528:free';

export default function AiChatbot({ visibleByDefault = false }) {
	const [open, setOpen] = useState(visibleByDefault);
	const [entered, setEntered] = useState(false);
	const [messages, setMessages] = useState([
		{ role: 'assistant', content: 'Hi! How can I help you explore Sarawak today?' }
	]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
    const listRef = useRef(null);
	const typeTimerRef = useRef(null);
	const [burst, setBurst] = useState(false);
	const [sendFly, setSendFly] = useState(false);
	const [showScrollDown, setShowScrollDown] = useState(false);
	const [toast, setToast] = useState('');
	const suggestions = [
		'Top attractions in Sarawak',
		'Best local food in Sarawak',
		'Plan a 2-day 1-night trip in Kuching',
		'Cultural sites to visit',
	];

	useEffect(() => {
		if (open) {
			const t = setTimeout(() => setEntered(true), 10);
			return () => clearTimeout(t);
		} else {
			setEntered(false);
		}
	}, [open]);

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [messages, open, loading]);

	useEffect(() => {
		return () => {
			if (typeTimerRef.current) clearInterval(typeTimerRef.current);
		};
	}, []);

	const openChat = () => {
		setOpen(true);
		setBurst(true);
	};

	const closeChat = () => {
		setOpen(false);
		setBurst(false);
	};

	const clearChat = () => {
		setMessages([{ role: 'assistant', content: 'Hi! How can I help you explore Sarawak today?' }]);
		setInput('');
		setError('');
		setTimeout(() => setToast('Cleared'), 0);
		setTimeout(() => setToast(''), 1200);
		if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
	};

	const copyText = async (text) => {
		try {
			await navigator.clipboard.writeText(text);
			setToast('Copied');
			setTimeout(() => setToast(''), 1200);
		} catch (_) {
			setToast('Copy failed');
			setTimeout(() => setToast(''), 1200);
		}
	};

	const handleSuggestionClick = (text) => {
		setInput(text);
	};

	const handleListScroll = () => {
		if (!listRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = listRef.current;
		const nearBottom = scrollHeight - (scrollTop + clientHeight) < 40;
		setShowScrollDown(!nearBottom);
	};

	const scrollToBottom = () => {
		if (!listRef.current) return;
		listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
	};

	const escapeHtml = (str) =>
		str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');

	// Minimal, safe-ish markdown (bold, italic, ### heading, line breaks)
	const mdToHtmlLite = (text) => {
        const esc = escapeHtml(text);
        const lines = esc.split('\n');
    
        let res = [];
        let inOl = false;
        let inUl = false;
        let para = [];
    
        const inline = (s) => {
            let h = s;
            // bold
            h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            // italic (avoid bold inner)
            h = h.replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s).,;!?]|$)/g, '$1<em>$2</em>');
            return h;
        };
    
        const flushPara = () => {
            if (para.length) {
                res.push('<p>' + inline(para.join('<br/>')) + '</p>');
                para = [];
            }
        };
    
        const closeLists = () => {
            if (inOl) { res.push('</ol>'); inOl = false; }
            if (inUl) { res.push('</ul>'); inUl = false; }
        };
    
        for (const raw of lines) {
            const line = raw.trim();
    
            // blank line → paragraph/list boundary
            if (!line) {
                flushPara();
                closeLists();
                continue;
            }
    
            // headings (### ...)
            if (line.startsWith('### ')) {
                flushPara();
                closeLists();
                res.push('<div class="ai-h3">' + inline(line.slice(4)) + '</div>');
                continue;
            }
    
            // ordered list (1. ...)
            const mOl = raw.match(/^\s*\d+\.\s+(.*)$/);
            if (mOl) {
                flushPara();
                if (!inOl) { closeLists(); res.push('<ol>'); inOl = true; }
                res.push('<li>' + inline(mOl[1]) + '</li>');
                continue;
            }
    
            // unordered list (- ... or * ...)
            const mUl = raw.match(/^\s*[\-\*]\s+(.*)$/);
            if (mUl) {
                flushPara();
                if (!inUl) { closeLists(); res.push('<ul>'); inUl = true; }
                res.push('<li>' + inline(mUl[1]) + '</li>');
                continue;
            }
    
            // normal text → accumulate paragraph lines
            para.push(line);
        }
    
        flushPara();
        closeLists();
        return res.join('');
    };

	const typewriterAppend = (fullText) => {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    
        // tokens = words OR newline runs, e.g. ["Hello", "\n", "1.", "Item", "\n\n", "-","Bullet"]
        const tokens = fullText.match(/(\n+|[^\s]+)/g) || [];
        let i = 0;
    
        // Start a new assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
        typeTimerRef.current = setInterval(() => {
            i++;
            setMessages(prev => {
                const next = [...prev];
                const idx = next.length - 1;
                if (!next[idx] || next[idx].role !== 'assistant') return next;
    
                // Rebuild string keeping newlines
                let out = '';
                for (let k = 0; k < i && k < tokens.length; k++) {
                    const t = tokens[k];
                    if (/^\n+$/.test(t)) {
                        out += t; // keep newline(s)
                    } else {
                        // add space if previous char isn't newline and not start
                        out += (out && !out.endsWith('\n')) ? ' ' + t : t;
                    }
                }
                next[idx] = { ...next[idx], content: out };
                return next;
            });
    
            if (i >= tokens.length) {
                clearInterval(typeTimerRef.current);
                typeTimerRef.current = null;
            }
        }, 35);
    };

	const sendMessage = async (e) => {
        e.preventDefault();
        setError('');
        const text = input.trim();
        if (!text || loading) return;
    
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setSendFly(true);
    
        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: MODEL, messages: newMessages })
            });
    
            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(`Request failed (${res.status}): ${t || res.statusText}`);
            }
    
            const data = await res.json();
            const reply = data?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
            typewriterAppend(reply);
        } catch (err) {
            setError(err.message || 'Unexpected error');
        } finally {
            setLoading(false);
            setSendFly(false);
        }
    };

	return (
		<>
            {/* Toggle button unchanged */}
            {!open && (
                <button
                    className={`ai-toggle-btn${burst ? ' burst' : ''}`}
                    onClick={openChat}
                    aria-label="Open AI Chat"
                    title="Chat"
                >
                    <img src={AiLogo} alt="Ai Logo" className="ai-logo" />
                </button>
            )}

            {open && (
                <div className={`ai-panel ${entered ? 'entered' : 'closing'}`}>
                    <div className="ai-header">
                        <div className="ai-header-title">
                            {/* <RiRobot2Fill className="ai-header-icon" /> */}
                            <div className="ai-header-text">
                                <span className="ai-header-title-main">Welcome to Sarawak</span>
                                <span className="ai-header-sub">Tourism AI Assistant</span>
                            </div>
                        </div>
                        <div className="ai-header-actions">
                            <button
                                className="ai-close-btn"
                                onClick={closeChat}
                                aria-label="Close"
                                title="Close"
                            >
                                <RxCross1 />
                            </button>
                        </div>
                    </div>

                    <div ref={listRef} className="ai-messages" onScroll={handleListScroll}>
                        {messages.map((m, i) => {
                            const isUser = m.role === 'user';
                            return (
                                <div key={i} className={`ai-row ${isUser ? 'user' : 'assistant'}`}>
                                    {!isUser && (
                                        <div className="ai-avatar" aria-hidden="true">
                                            <RiRobot2Fill />
                                        </div>
                                    )}
                                    <div className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--assistant'}`}>
                                        {isUser ? (
                                            <span>{m.content}</span>
                                        ) : (
                                            <div
                                                className="ai-bubble-content"
                                                dangerouslySetInnerHTML={{ __html: mdToHtmlLite(m.content) }}
                                            />
                                        )}
                                    </div>
                                    {!isUser && (
                                        <div className="ai-actions">
                                            <button className="ai-action" onClick={() => copyText(m.content)} aria-label="Copy message">Copy</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="ai-row assistant">
                                <div className="ai-bubble ai-bubble--assistant">
                                    <div className="ai-typing">
                                        <span className="ai-dot" />
                                        <span className="ai-dot delay-1" />
                                        <span className="ai-dot delay-2" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            // <div className="ai-error shake-on-error">{error}</div>
                            <div className="error-message">
                                <p>Oops something went wrong</p>
                            </div>
                        )}

                        <button
                            className={`ai-scroll-down ${showScrollDown ? 'visible' : ''}`}
                            onClick={scrollToBottom}
                            aria-label="Scroll to latest"
                            title="Scroll to latest"
                        >
                            <IoIosArrowDown />
                        </button>
                    </div>

                    <div className="ai-suggestions">
                        {suggestions.map((s, idx) => (
                            <button key={idx} className="ai-chip" onClick={() => handleSuggestionClick(s)}>
                                {s}
                            </button>
                        ))}
                    </div>

                    {toast && <div className="ai-toast">{toast}</div>}

                    <form onSubmit={sendMessage} className="ai-form">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about Sarawak tourism…"
                            className="ai-input"
                        />
                        <button type="submit" disabled={loading} className={`ai-send-btn${(sendFly || loading) ? ' flying' : ''}`}>
                            <IoIosSend className="ai-send-icon" />
                            {!(sendFly || loading) && <span className="ai-send-text">Send</span>}
                        </button>
                    </form>
                </div>
            )}
        </>
	);
}