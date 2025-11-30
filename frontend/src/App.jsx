import { useState, useRef, useEffect } from "react";
import { IoSend, IoCopy, IoCheckmark, IoChevronDown, IoChevronUp } from "react-icons/io5";

// 추천 질문 목록
const SUGGESTED_QUESTIONS = [
  "음주운전 처벌 기준이 어떻게 되나요?",
  "운전면허 취소 기준은 무엇인가요?",
  "어린이 보호구역 속도 제한은?",
  "신호위반 벌점은 몇 점인가요?",
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 답변 복사 기능
  const copyToClipboard = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // 출처 토글
  const toggleSources = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 추천 질문 클릭
  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

const sendMessage = async (customMessage = null) => {
  const messageToSend = customMessage || input;
  if (!messageToSend.trim()) return;

  const newMessage = { role: "user", content: messageToSend };
  setMessages((prev) => [...prev, newMessage]);
  setInput("");
  setLoading(true);

  try {
    const res = await fetch("https://25637waki4.execute-api.us-east-1.amazonaws.com/main/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage.content }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { 
        role: "assistant", 
        content: data.answer,
        sources: data.contexts || []  // 출처 정보 저장
      }
    ]);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "오류가 발생했습니다. 다시 시도해 주세요." }
    ]);
  }

  setLoading(false);
};

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  return (
    <div className="w-full min-h-screen bg-[#1c1d20] flex justify-center p-4 text-gray-200">
      <div className="w-full max-w-3xl bg-[#1f2024] rounded-xl shadow-xl p-6 flex flex-col border border-gray-700 h-[90vh]">
        <h1 className="text-center text-xl font-semibold mb-5 text-gray-100 flex items-center gap-2 justify-center">
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
          BlackBox RoadLaw Assistant
        </h1>

        {/* 추천 질문 (대화가 없을 때만 표시) */}
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 text-center">추천 질문</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="px-3 py-1.5 text-xs bg-[#2a2a2f] text-gray-300 rounded-full
                             hover:bg-[#3a3b3f] transition border border-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#111214] rounded-lg border border-gray-700 flex flex-col">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`
                ${msg.role === "user" ? "self-end" : "self-start"}
                max-w-[80%]
              `}
            >
              {/* 메시지 내용 */}
              <div
                className={`
                  text-sm leading-relaxed
                  whitespace-pre-line break-words
                  px-3 py-2 rounded-lg
                  ${
                    msg.role === "user"
                      ? "bg-[#343541] text-gray-100"
                      : "bg-[#444654] text-gray-200"
                  }
                `}
              >
                {msg.content}
              </div>

              {/* 어시스턴트 메시지: 복사 버튼 + 출처 */}
              {msg.role === "assistant" && (
                <div className="mt-1 flex flex-col gap-1">
                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(msg.content, index)}
                      className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition"
                    >
                      {copiedIndex === index ? (
                        <>
                          <IoCheckmark size={12} />
                          복사됨
                        </>
                      ) : (
                        <>
                          <IoCopy size={12} />
                          복사
                        </>
                      )}
                    </button>

                    {/* 출처 토글 버튼 */}
                    {msg.sources && msg.sources.length > 0 && (
                      <button
                        onClick={() => toggleSources(index)}
                        className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition"
                      >
                        {expandedSources[index] ? (
                          <>
                            <IoChevronUp size={12} />
                            출처 숨기기
                          </>
                        ) : (
                          <>
                            <IoChevronDown size={12} />
                            출처 보기 ({msg.sources.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 출처 내용 */}
                  {expandedSources[index] && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 p-3 bg-[#2a2a2f] rounded-lg border border-gray-600">
                      <p className="text-xs text-emerald-400 font-medium mb-2">📚 참고 법률 조항</p>
                      {msg.sources.map((source, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700 last:border-0 last:mb-0 last:pb-0"
                        >
                          <span className="text-emerald-500">[{sIdx + 1}]</span>{" "}
                          {source.length > 200 ? source.substring(0, 200) + "..." : source}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="self-start bg-[#444654] text-gray-300 px-4 py-2 rounded-lg animate-pulse">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="flex mt-4 gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            placeholder="도로교통법 질문을 입력하세요"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            className="flex-1 px-4 py-3 bg-[#2a2a2f] text-gray-100 border border-gray-600 rounded-lg
                       resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                       text-white p-4 rounded-lg flex items-center justify-center transition"
          >
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
