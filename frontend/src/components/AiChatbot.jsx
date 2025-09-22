import React, { useState, useRef, useEffect } from 'react';
import '../styles/AiChatbot.css';

const API_ENDPOINT = '/api/ai/chat';
const MODEL = 'deepseek/deepseek-chat-v3.1:free';

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

		const words = fullText.split(/\s+/);
		let i = 0;

		setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

		typeTimerRef.current = setInterval(() => {
			i++;
			setMessages(prev => {
				const next = [...prev];
				const idx = next.length - 1;
				if (!next[idx] || next[idx].role !== 'assistant') return next;
				next[idx] = {
					...next[idx],
					content: words.slice(0, i).join(' ') + (i < words.length ? ' ' : '')
				};
				return next;
			});
			if (i >= words.length) {
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
		}
	};

	return (
		<>
			{!open && (
				<button
					className="ai-toggle-btn"
					onClick={() => setOpen(true)}
					aria-label="Open AI Chat"
					title="Chat"
				>
					💬
				</button>
			)}

			{open && (
				<div className={`ai-panel ${entered ? 'entered' : ''}`}>
					<div className="ai-header">
						<div className="ai-header-title">AI Assistant</div>
						<div className="ai-header-actions">
							<button
								className="ai-close-btn"
								onClick={() => setOpen(false)}
								aria-label="Close"
								title="Close"
							>
								✕
							</button>
						</div>
					</div>

					<div ref={listRef} className="ai-messages">
						{messages.map((m, i) => {
							const isUser = m.role === 'user';
							return (
								<div key={i} className={`ai-row ${isUser ? 'user' : 'assistant'}`}>
									<div
										className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--assistant'}`}
									>
										{isUser ? (
											<span>{m.content}</span>
										) : (
											<div
												className="ai-bubble-content"
												dangerouslySetInnerHTML={{ __html: mdToHtmlLite(m.content) }}
											/>
										)}
									</div>
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
							<div className="ai-error">{error}</div>
						)}
					</div>

					<form onSubmit={sendMessage} className="ai-form">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Ask me anything about Sarawak tourism…"
							className="ai-input"
						/>
						<button type="submit" disabled={loading} className="ai-send-btn">
							{loading ? 'Sending…' : 'Send'}
						</button>
					</form>
				</div>
			)}
		</>
	);
}