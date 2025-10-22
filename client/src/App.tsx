import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Sandpack } from "@codesandbox/sandpack-react";
import Split from "react-split";
import API from "./api";
import ErrorBoundary from "./ErrorBoundary";

interface Snippet {
  _id: string;
  title: string;
  code: string;
  language: string;
}

function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [editorCode, setEditorCode] = useState<string>("");
  const [runCode, setRunCode] = useState<string>("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Responsive layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch snippets
  const fetchSnippets = async () => {
    try {
      const res = await API.get("/api/snippets");
      if (res.data.success) {
        setSnippets(res.data.data);
        if (!activeId && res.data.data.length > 0) {
          setActiveId(res.data.data[0]._id);
          setEditorCode(res.data.data[0].code || "");
          setRunCode(res.data.data[0].code || "");
        }
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const activeSnippet = snippets.find((s) => s._id === activeId);
  useEffect(() => {
    if (activeSnippet) {
      setEditorCode(activeSnippet.code || "");
      setRunCode(activeSnippet.code || "");
    }
  }, [activeSnippet]);

  // Autosave using debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCodeChange = (value: string) => {
    setEditorCode(value || "");
    if (activeId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => handleUpdate(activeId, value || ""), 2000);
    }
  };

  // File management
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      setSaveMessage("❌ File title is required!");
      return;
    }
    try {
      const res = await API.post("/api/snippets", { title: newTitle, code: "", language: "React" });
      if (res.data.success) {
        setSaveMessage("✅ File created!");
        setNewTitle("");
        fetchSnippets();
        setActiveId(res.data.data._id);
        setEditorCode("");
        setRunCode("");
      } else setSaveMessage("❌ Failed to create file.");
    } catch (err) {
      console.error(err);
      setSaveMessage("❌ Failed to create file.");
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/api/snippets/${id}`);
      if (id === activeId) setActiveId(null);
      fetchSnippets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: string, code: string, title?: string) => {
    const snippet = snippets.find((s) => s._id === id);
    if (!snippet) return;
    try {
      await API.put(`/api/snippets/${id}`, { title: title || snippet.title, code, language: snippet.language });
      fetchSnippets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = (id: string, newTitle: string) => handleUpdate(id, editorCode, newTitle);

  // Auth handlers
  const handleLogin = async () => {
    try {
      const res = await API.post("/api/auth/login", { email: authEmail, password: authPassword });
      if (res.data.success) {
        setUser(authEmail);
        setShowLogin(false);
        setAuthMessage("✅ Logged in successfully!");
      } else setAuthMessage("❌ Login failed: " + res.data.message);
    } catch (err) {
      console.error(err);
      setAuthMessage("❌ Login error");
    }
    setTimeout(() => setAuthMessage(null), 3000);
  };

  const handleRegister = async () => {
    try {
      const res = await API.post("/api/auth/register", { email: authEmail, password: authPassword });
      if (res.data.success) {
        setUser(authEmail);
        setShowRegister(false);
        setAuthMessage("✅ Registered successfully!");
      } else setAuthMessage("❌ Registration failed: " + res.data.message);
    } catch (err) {
      console.error(err);
      setAuthMessage("❌ Registration error");
    }
    setTimeout(() => setAuthMessage(null), 3000);
  };

  const bgColor = theme === "dark" ? "#1e1e1e" : "#f5f5f5";
  const textColor = theme === "dark" ? "#f5f5f5" : "#1e1e1e";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `2px solid ${theme === "dark" ? "#333" : "#ccc"}` }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {!user && <>
            <button onClick={() => setShowLogin(true)} style={{ padding: "6px 12px", borderRadius: "5px", border: "none", backgroundColor: "#007bff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Sign In</button>
            <button onClick={() => setShowRegister(true)} style={{ padding: "6px 12px", borderRadius: "5px", border: "none", backgroundColor: "#28a745", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Sign Up</button>
          </>}
          {user && <span style={{ fontWeight: "bold" }}>👤 {user}</span>}
        </div>
        <h1 style={{ margin: 0, textAlign: "center", flex: 1 }}>🔐 CipherStudio IDE</h1>
        {/* Theme Toggle with Moon/Sun */}
        <label style={{ display: "inline-block", width: "50px", height: "26px", cursor: "pointer" }}>
          <input type="checkbox" checked={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ display: "none" }} />
          <span style={{ position: "relative", display: "block", width: "100%", height: "100%", backgroundColor: theme === "dark" ? "#333" : "#ffdd33", borderRadius: "26px", transition: "0.3s" }}>
            <span style={{ position: "absolute", top: "3px", left: theme === "dark" ? "24px" : "2px", width: "20px", height: "20px", backgroundColor: theme === "dark" ? "#fff" : "#000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: theme === "dark" ? "#333" : "#ffdd33", transition: "0.3s" }}>
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
          </span>
        </label>
      </div>

      {authMessage && <p style={{ textAlign: "center", margin: "5px 0" }}>{authMessage}</p>}

      {/* Main layout */}
      <Split className="horizontal-split" sizes={[20, 80]} minSize={200} gutterSize={6} style={{ display: "flex", flex: 1 }} direction={isMobile ? "vertical" : "horizontal"}>
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `2px solid ${theme === "dark" ? "#333" : "#ccc"}`, padding: "10px", overflowY: "auto" }}>
          <h2 style={{ textAlign: "center" }}>Add File</h2>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" placeholder="File Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ padding: "5px" }} />
            <button type="submit" style={{ padding: "6px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#007bff", color: "#fff" }}>Add File</button>
          </form>
          {saveMessage && <p style={{ textAlign: "center", marginTop: "5px" }}>{saveMessage}</p>}
          <hr style={{ margin: "10px 0" }} />
          {snippets.map((s) => (
            <div key={s._id} onClick={() => { setActiveId(s._id); setEditorCode(s.code || ""); setRunCode(s.code || ""); }} style={{ padding: "5px", marginBottom: "4px", borderRadius: "5px", cursor: "pointer", backgroundColor: activeId === s._id ? "#555" : "transparent", color: textColor }}>
              {editingTitleId === s._id ? <input autoFocus defaultValue={s.title} onBlur={(e) => { handleRename(s._id, e.target.value); setEditingTitleId(null); }} /> : <span>{s.title}</span>}
              <button onClick={() => setEditingTitleId(s._id)} style={{ fontSize: "14px", padding: "2px 5px", marginLeft: "5px" }}>✏️</button>
              <button onClick={() => handleDelete(s._id)} style={{ fontSize: "14px", padding: "2px 5px", marginLeft: "5px" }}>❌</button>
            </div>
          ))}
        </div>

        {/* Editor + Preview */}
        <Split className="vertical-split" direction={isMobile ? "vertical" : "vertical"} sizes={[50, 50]} minSize={200} gutterSize={6} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <ErrorBoundary>
            {/* Editor */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ padding: "5px", textAlign: "center", fontWeight: "bold" }}>🧠 Code Editor</div>
              <Editor height="100%" language="javascript" theme={theme === "dark" ? "vs-dark" : "light"} value={editorCode} onChange={handleCodeChange} options={{ automaticLayout: true }} />
              <button onClick={() => setRunCode(editorCode)} style={{ margin: "5px", padding: "8px", borderRadius: "5px", border: "none", background: "#28a745", color: "#fff", cursor: "pointer" }}>▶️ Run Code</button>
            </div>

            {/* Live Preview */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ padding: "5px", textAlign: "center", fontWeight: "bold" }}>⚡ Live Preview</div>
              <Sandpack template="react" files={{ "/App.js": runCode || editorCode }} options={{ showConsole: true }} style={{ flex: 1, height: "100%" }} />
            </div>
          </ErrorBoundary>
        </Split>
      </Split>
    </div>
  );
}

export default App;
