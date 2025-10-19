import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Sandpack } from "@codesandbox/sandpack-react";
import API from "./api";

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
  const [newCode, setNewCode] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [runCode, setRunCode] = useState<string>("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(
    localStorage.getItem("user") || null
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSnippets = async () => {
    try {
      const res = await API.get("/api/snippets");
      if (res.data.success) {
        setSnippets(res.data.data);
        if (!activeId && res.data.data.length > 0) setActiveId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const activeSnippet = snippets.find((s) => s._id === activeId);

  useEffect(() => {
    if (activeSnippet) setRunCode(activeSnippet.code);
  }, [activeSnippet]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      setSaveMessage("❌ File title is required!");
      return;
    }

    try {
      const res = await API.post("/api/snippets", {
        title: newTitle,
        code: newCode || "", // optional code
        language: "React",
      });

      if (res.data.success) {
        setSaveMessage("✅ File created!");
        setNewTitle("");
        setNewCode("");
        fetchSnippets();
      } else {
        setSaveMessage("❌ Failed to create file.");
      }
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
      await API.put(`/api/snippets/${id}`, {
        title: title || snippet.title,
        code,
        language: snippet.language,
      });
      fetchSnippets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = (id: string, newTitle: string) =>
    handleUpdate(id, activeSnippet?.code || "", newTitle);

  const login = () => {
    const name = prompt("Enter username:");
    if (name) {
      localStorage.setItem("user", name);
      setUser(name);
    }
  };
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const bgColor = theme === "dark" ? "#1e1e1e" : "#f5f5f5";
  const textColor = theme === "dark" ? "#f5f5f5" : "#1e1e1e";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: bgColor,
        color: textColor,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "15px 0",
          borderBottom: `2px solid ${theme === "dark" ? "#333" : "#ccc"}`,
        }}
      >
        <h1>🔐 CipherStudio IDE</h1>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            position: "absolute",
            top: "10px",
            right: "20px",
            padding: "10px 15px",
            borderRadius: "25px",
            border: "none",
            cursor: "pointer",
            backgroundColor: theme === "dark" ? "#333" : "#ffdd33",
            color: theme === "dark" ? "#fff" : "#000",
            fontWeight: "bold",
          }}
        >
          {theme === "dark" ? "🌙 Night Mode" : "🌞 Day Mode"}
        </button>
        {user ? (
          <button
            onClick={logout}
            style={{ position: "absolute", top: "10px", left: "20px" }}
          >
            Logout ({user})
          </button>
        ) : (
          <button
            onClick={login}
            style={{ position: "absolute", top: "10px", left: "20px" }}
          >
            Login/Register
          </button>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          overflow: "hidden",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: window.innerWidth < 768 ? "100%" : "250px",
            padding: "20px",
            borderRight:
              window.innerWidth < 768
                ? "none"
                : `2px solid ${theme === "dark" ? "#333" : "#ccc"}`,
            borderBottom:
              window.innerWidth < 768
                ? `2px solid ${theme === "dark" ? "#333" : "#ccc"}`
                : "none",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Add File</h2>
          <form
            onSubmit={handleAdd}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="File Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: "5px" }}
            />
            <button type="submit" style={{ padding: "5px", cursor: "pointer" }}>
              Add File
            </button>
          </form>
          {saveMessage && (
            <p style={{ marginTop: "5px", textAlign: "center" }}>{saveMessage}</p>
          )}

          <hr style={{ margin: "20px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {snippets.map((s) => (
              <div
                key={s._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  backgroundColor:
                    activeId === s._id
                      ? theme === "dark"
                        ? "#333"
                        : "#eef"
                      : "transparent",
                  cursor: "pointer",
                  border:
                    activeId === s._id
                      ? `1px solid ${theme === "dark" ? "#fff" : "#000"}`
                      : "1px solid transparent",
                }}
              >
                {editingTitleId === s._id ? (
                  <input
                    autoFocus
                    defaultValue={s.title}
                    onBlur={(e) => {
                      handleRename(s._id, e.target.value);
                      setEditingTitleId(null);
                    }}
                  />
                ) : (
                  <span onClick={() => setActiveId(s._id)}>{s.title}</span>
                )}
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={() => setEditingTitleId(s._id)}
                    style={{ cursor: "pointer" }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    style={{
                      background: "red",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                    }}
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            gap: "10px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {activeSnippet ? (
              <>
                <Editor
                  height="50%"
                  language="javascript"
                  value={activeSnippet.code || "// Start coding here"}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  onChange={(value) => {
                    handleUpdate(activeSnippet._id, value || "");
                    setRunCode(value || "");
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setRunCode(activeSnippet.code)}
                    style={{
                      marginTop: "5px",
                      padding: "5px 10px",
                      cursor: "pointer",
                      backgroundColor: theme === "dark" ? "#333" : "#ffdd33",
                      color: theme === "dark" ? "#fff" : "#000",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    Run
                  </button>
                </div>
              </>
            ) : (
              <p style={{ textAlign: "center", padding: "20px" }}>
                Select or create a file to start coding!
              </p>
            )}
          </div>

          <div
            style={{
              flex: 1,
              marginTop: "10px",
              border: `1px solid ${theme === "dark" ? "#555" : "#ccc"}`,
              borderRadius: "5px",
              overflow: "hidden",
              backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
            }}
          >
            {activeSnippet ? (
              <Sandpack
                template="react"
                files={{ "/App.js": runCode || activeSnippet.code || "" }}
                options={{ showConsole: true, showNavigator: true }}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <p style={{ textAlign: "center", padding: "20px" }}>
                Live preview will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
