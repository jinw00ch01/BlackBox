import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    // 테스트용 고정 응답
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "테스트" },
      ]);
      setLoading(false);
    }, 500);
  };

  // 자동 높이 증가
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  return (
    <div className="w-full min-h-screen bg-[#1c1d20] flex justify-center p-4 text-gray-200">
      <div className="w-full max-w-3xl bg-[#1f2024] rounded-xl shadow-xl p-6 flex flex-col border border-gray-700">

        {/* Header */}
        <h1 className="text-center text-xl font-semibold mb-5 text-gray-100 flex items-center gap-2 justify-center">
          <div className="w-3 h-3 rounded-sm bg-gray-400"></div>
          BlackBox RoadLaw Assistant
        </h1>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#111214] rounded-lg border border-gray-700 flex flex-col">

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`
                text-sm leading-relaxed
                whitespace-pre-line break-words
                inline-block px-3 py-2 rounded-lg max-w-[70%]
                ${
                  msg.role === "user"
                    ? "self-end bg-[#343541] text-gray-100"
                    : "self-start bg-[#444654] text-gray-200"
                }
              `}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="self-start bg-[#444654] text-gray-300 px-4 py-2 rounded-lg w-20 animate-pulse">
              ...
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="flex mt-4 gap-3 items-end">

          {/* textarea auto-resize */}
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
                       resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-400"
          />

          <button
            onClick={sendMessage}
            className="bg-[#3a3b3f] hover:bg-[#4b4d52] text-white p-4 rounded-lg 
                       flex items-center justify-center transition border border-gray-600"
          >
            <IoSend size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
