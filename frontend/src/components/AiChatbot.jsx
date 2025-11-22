import React, { useState, useRef, useEffect } from 'react';
import '../styles/AiChatbot.css';
import { IoIosSend, IoIosArrowDown, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { RxCross1, RxReset } from "react-icons/rx";
import { RiRobot2Fill } from "react-icons/ri";
import AiLogo from '../assets/AiLogo.gif';

export default function AiChatbot({ visibleByDefault = false }) {
	const [open, setOpen] = useState(visibleByDefault);
	const [entered, setEntered] = useState(false);
	const [messages, setMessages] = useState([
		{ role: 'assistant', content: 'Hi! How can I help you explore Sarawak today?' }
	]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
    const [errorDetail, setErrorDetail] = useState(null);
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
    const suggRef = useRef(null);
    const [suggPage, setSuggPage] = useState(0);
    const [suggPages, setSuggPages] = useState(1);
    const [showScrollbar, setShowScrollbar] = useState(true); // toggle if needed
    const touchStateRef = useRef({ down: false, startX: 0, startScroll: 0 });
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const cooldownTimerRef = useRef(null);

    // Define API endpoint safely (use Vite env if set, otherwise default)
    const API_ENDPOINT = (import.meta?.env?.VITE_AI_CHAT_ENDPOINT) || '/api/ai/chat';

    const recalcPages = () => {
        const el = suggRef.current;
        if (!el) return;
        const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
        setSuggPages(pages);
        const page = Math.round(el.scrollLeft / el.clientWidth);
        setSuggPage(Math.min(pages - 1, Math.max(0, page)));
    };

    useEffect(() => {
        // Recalc on open/resize
        const onResize = () => recalcPages();
        window.addEventListener('resize', onResize);
        const id = setTimeout(recalcPages, 0);
        return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(id);
        };
    }, [open]);

    const onSuggestionsScroll = () => {
        const el = suggRef.current;
        if (!el) return;
        const page = Math.round(el.scrollLeft / el.clientWidth);
        setSuggPage(Math.min(suggPages - 1, Math.max(0, page)));
    };

    const scrollPage = (dir) => {
        const el = suggRef.current;
        if (!el) return;
        const amount = Math.max(120, el.clientWidth - 40);
        el.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };

    const scrollToPage = (idx) => {
        const el = suggRef.current;
        if (!el) return;
        const target = Math.min(suggPages - 1, Math.max(0, idx));
        el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
    };

    const onSuggestionsKeyDown = (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollPage(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollPage(-1);
        }
    };

    const getX = (e) => (e.touches && e.touches[0]?.clientX) ?? e.clientX;
    const onTouchStart = (e) => {
        const el = suggRef.current;
        if (!el) return;
        touchStateRef.current.down = true;
        touchStateRef.current.startX = getX(e);
        touchStateRef.current.startScroll = el.scrollLeft;
    };
    const onTouchMove = (e) => {
        const el = suggRef.current;
        const st = touchStateRef.current;
        if (!el || !st.down) return;
        const dx = getX(e) - st.startX;
        el.scrollLeft = st.startScroll - dx; // natural drag
    };
    const snapToNearestPage = () => {
        const el = suggRef.current;
        if (!el) return;
        const page = Math.round(el.scrollLeft / el.clientWidth);
        scrollToPage(page);
    };
    const onTouchEnd = () => {
        touchStateRef.current.down = false;
        snapToNearestPage();
    };

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

	// Strip model control tokens like <|begin_of_sentence|> or fullwidth variants
	const normalizeModelOutput = (text) => {
		return String(text)
			.replace(/<\|\s*begin[^|>]*\|>/gi, '')
			.replace(/<\|\s*end[^|>]*\|>/gi, '')
			.replace(/[＜<][\|｜]?begin[^＜>｜|]*[\|｜]?[＞>]/gi, '')
			.replace(/[＜<][\|｜]?end[^＜>｜|]*[\|｜]?[＞>]/gi, '')
			.replace(/<\|\s*im_start\s*\|>|<\|\s*im_end\s*\|>/gi, '')
			.replace(/<\/s>|<s>/gi, '');
	};

	// Minimal, safe-ish markdown (bold, italic, #/##/### heading, line breaks)
	const mdToHtmlLite = (text) => {
        // Normalize + escape
        let esc = escapeHtml(normalizeModelOutput(text));

        // 1) Strip fenced code blocks: keep inner text, remove backticks and optional language
        esc = esc.replace(/```(?:[\w+-]+\n)?([\s\S]*?)```/g, '$1');

        // 2) Strip inline code ticks: keep inner text
        esc = esc.replace(/`([^`]+)`/g, '$1');

        const rawLines = esc.split('\n');

        let res = [];
        let inOl = false;
        let inUl = false;
        let para = [];
    
        const inline = (s) => {
            let h = s;
            h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
    
        // Helper: detect table separator line like |---|---|
        const isTableSep = (s) => /^\s*\|?\s*[-:]+(?:\s*\|\s*[-:]+)+\s*\|?\s*$/.test(s.trim());
        const isTableRow = (s) => /^\s*\|.*\|\s*$/.test(s.trim());
    
        for (let i = 0; i < rawLines.length; i++) {
            const raw = rawLines[i];
            const line = raw.trim();
    
            // blank line → paragraph/list boundary
            if (!line) {
                flushPara();
                closeLists();
                continue;
            }
    
            // 3) Convert markdown tables to bullet lists (no table rendering)
            if (isTableRow(raw)) {
                flushPara();
                closeLists();
    
                // Parse header cells from first table row
                const headerCells = raw.split('|').map(c => c.trim()).filter(Boolean);
    
                // Optional separator row
                let j = i + 1;
                if (j < rawLines.length && isTableSep(rawLines[j])) j++;
    
                // Accumulate subsequent table rows
                let items = [];
                while (j < rawLines.length && isTableRow(rawLines[j])) {
                    const cells = rawLines[j].split('|').map(c => c.trim()).filter(Boolean);
                    const pairs = cells.map((v, idx) => {
                        const key = headerCells[idx] || `Col ${idx + 1}`;
                        return `${key}: ${inline(v)}`;
                    });
                    items.push(`<li>${pairs.join(' — ')}</li>`);
                    j++;
                }
    
                // Emit as a normal bullet list
                if (items.length) res.push('<ul>' + items.join('') + '</ul>');
    
                // Skip the lines we consumed
                i = j - 1;
                continue;
            }
    
            // headings (#, ##, ###)
            const mH = raw.match(/^\s*(#{1,3})\s+(.*)$/);
            if (mH) {
                flushPara();
                closeLists();
                const level = mH[1].length;
                const text = inline(mH[2]);
                const cls = level === 1 ? 'ai-h1' : level === 2 ? 'ai-h2' : 'ai-h3';
                res.push(`<div class="${cls}">${text}</div>`);
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
        setErrorDetail(null);
        const text = input.trim();
        if (!text || loading) return;

        if (cooldownSeconds > 0) {
            setError(`Please wait ${cooldownSeconds}s before sending another message.`);
            setErrorDetail({ status: 429, code: 'RATE_LIMITED', retryAfterSeconds: cooldownSeconds, source: 'CLIENT_COOLDOWN' });
            console.warn('AiChatbot: blocked by client cooldown', { cooldownSeconds });
            return;
        }

        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setSendFly(true);

        try {
            const bodyPayload = { messages: newMessages };
            // Remove client-side process.env usage; server handles model selection
            console.log('AiChatbot: sending request', {
                endpoint: API_ENDPOINT,
                modelSelection: 'server',
                payloadSummary: { messagesCount: newMessages.length }
            });

            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            console.log('AiChatbot: response received', {
                status: res.status,
                retryAfterHeader: res.headers.get('Retry-After')
            });

            // Handle rate limit with header/body extraction
            if (res.status === 429) {
                let retryAfter = Number(res.headers.get('Retry-After')) || 0;
                let detailBody = null;
                if (!retryAfter) {
                    try {
                        detailBody = await res.json();
                        retryAfter = Number(detailBody?.retryAfterSeconds) || 15;
                    } catch (parseErr) {
                        console.warn('AiChatbot: failed to parse 429 body as JSON', parseErr);
                    }
                }

                console.warn('AiChatbot: 429 Too Many Requests', {
                    retryAfter,
                    detailBody
                });

                setCooldownSeconds(retryAfter || 15);
                setError(`Too many requests. Try again in ${retryAfter || 15}s.`);
                setErrorDetail(detailBody || { status: 429, code: 'RATE_LIMITED', retryAfterSeconds: retryAfter || 15 });

                if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                cooldownTimerRef.current = setInterval(() => {
                    setCooldownSeconds(prev => {
                        if (prev <= 1) {
                            clearInterval(cooldownTimerRef.current);
                            cooldownTimerRef.current = null;
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return;
            }

            if (!res.ok) {
                let detail = null;
                let rawText = '';
                try {
                    detail = await res.json();
                } catch {
                    try {
                        rawText = await res.text();
                    } catch {
                        rawText = '';
                    }
                }

                // Prefer provider-style error fields if present
                const providerMsg = detail?.error?.message || detail?.message || '';
                const providerCode = detail?.error?.code || detail?.code;
                const providerMeta = detail?.error?.metadata || detail?.metadata;

                // Build a readable message
                let humanMsg = providerMsg || rawText || 'Unknown error';
                if (providerCode) humanMsg = `${humanMsg} (code: ${providerCode})`;

                console.error('AiChatbot: request failed', {
                    status: res.status,
                    reason: { message: providerMsg || rawText || 'Unknown', code: providerCode, metadata: providerMeta },
                    detail
                });

                setError(`Request failed (${res.status}): ${humanMsg}`);
                setErrorDetail(detail || { status: res.status, raw: rawText || humanMsg });
                return;
            }

            const data = await res.json();
            console.log('AiChatbot: success', {
                choicesLen: Array.isArray(data?.choices) ? data.choices.length : 0
            });

            const replyRaw = data?.choices?.[0]?.message?.content ?? '';
            const reply = normalizeModelOutput(replyRaw).trim();
            typewriterAppend(reply);
        } catch (err) {
            console.error('AiChatbot: unexpected error', err);
            setError(err.message || 'Unexpected error');
            setErrorDetail({ message: err.message || String(err) });
        } finally {
            setLoading(false);
            setSendFly(false);
            console.log('AiChatbot: sendMessage finished');
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
                            <div className="error-message">
                                <p>Oops something went wrong!</p>
                                {errorDetail && (
                                    <div className="error-reason">
                                        {(() => {
                                            const code = errorDetail?.error?.code || errorDetail?.code;
                                            const status = errorDetail?.status;
                                            const retry = typeof errorDetail?.retryAfterSeconds === 'number' ? errorDetail.retryAfterSeconds : null;
                                            const providerName = errorDetail?.error?.metadata?.provider_name || errorDetail?.metadata?.provider_name;

                                            // Try to parse nested provider raw JSON if present
                                            const metaRawStr = errorDetail?.error?.metadata?.raw || errorDetail?.metadata?.raw;
                                            let providerMsg = errorDetail?.error?.message || errorDetail?.message || errorDetail?.raw;
                                            let providerCode = code;

                                            if (metaRawStr && typeof metaRawStr === 'string') {
                                                try {
                                                    const rawObj = JSON.parse(metaRawStr);
                                                    const innerErr = rawObj?.error;
                                                    if (innerErr?.message) providerMsg = innerErr.message;
                                                    if (innerErr?.code) providerCode = innerErr.code;
                                                } catch {
                                                    // ignore parse errors; fall back to existing fields
                                                }
                                            }

                                            return (
                                                <>
                                                    <p>{providerCode ? `Reason: ${providerCode}` : 'Reason: Unknown'}</p>
                                                    {status && <p>{`Status: ${status}`}</p>}
                                                    {retry !== null && <p>{`Retry after: ${retry}s`}</p>}
                                                    {/* {providerName && <p>{`Upstream: ${providerName}`}</p>} */}
                                                    {/* {providerMsg && <p>{`Details: ${providerMsg}`}</p>} */}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
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

                    {/* input and suggestions area unchanged */}
                    <div className="ai-suggestions-nav">
                        <div
                            className={`ai-suggestions ${showScrollbar ? 'show-scrollbar' : 'hide-scrollbar'}`}
                            ref={suggRef}
                            tabIndex={0}
                            role="region"
                            aria-label="AI suggestions"
                            onKeyDown={onSuggestionsKeyDown}
                            onScroll={onSuggestionsScroll}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {suggestions.map((s, idx) => (
                                <button key={idx} className="ai-chip" onClick={() => handleSuggestionClick(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ai-suggest-dots" role="navigation" aria-label="Suggestions pagination">
                        {Array.from({ length: suggPages }, (_, i) => (
                            <button
                                key={i}
                                className={`ai-suggest-dot ${i === suggPage ? 'active' : ''}`}
                                onClick={() => scrollToPage(i)}
                                aria-current={i === suggPage ? 'page' : undefined}
                                aria-label={`Go to suggestions page ${i + 1}`}
                            />
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
                        <button type="submit" disabled={loading || cooldownSeconds > 0} className={`ai-send-btn${(sendFly || loading) ? ' flying' : ''}`}>
                            <IoIosSend className="ai-send-icon" />
                            {!(sendFly || loading) && (
                                <span className="ai-send-text">
                                    {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Send'}
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </>
	);
}