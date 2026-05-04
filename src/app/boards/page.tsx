"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createBoard, getBoards, deleteBoard } from "@/lib/firestore";
import { Board } from "@/types";
import { Plus, Trash2, LogOut } from "lucide-react";

const COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c",
  "#16a34a", "#0891b2", "#9333ea", "#dc2626"
];

export default function BoardsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); return; }
    getBoards(user.uid).then((b) => {
      setBoards(b);
      setReady(true);
    });
  }, [loading, user]);

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    const ref = await createBoard(user.uid, title.trim(), color);
    setBoards((prev) => [{ id: ref.id, title: title.trim(), color, userId: user.uid, createdAt: Date.now() }, ...prev]);
    setTitle("");
    setColor(COLORS[0]);
    setShowForm(false);
  };

  const handleDelete = async (boardId: string) => {
    await deleteBoard(boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5" }}>
      <div style={{ width: 24, height: 24, border: "2px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <header style={{ backgroundColor: "#2563eb", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <rect x="3" y="3" width="8" height="18" rx="2"/>
              <rect x="13" y="3" width="8" height="11" rx="2"/>
            </svg>
          </div>
          <span style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Trello Clone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.photoURL && <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%" }} />}
          <button onClick={logout} style={{ color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer" }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a1a" }}>Mis tableros</h1>
          <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Plus size={16} /> Nuevo tablero
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: 320 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Crear tablero</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nombre del tablero"
              autoFocus
              style={{ width: "100%", border: "1px solid #e2e2e2", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: c, border: color === c ? "3px solid #1a1a1a" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer" }}>Crear</button>
              <button onClick={() => setShowForm(false)} style={{ color: "#6b6b6b", padding: "8px 16px", borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer", backgroundColor: "transparent" }}>Cancelar</button>
            </div>
          </div>
        )}

        {boards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No tenés tableros todavía</p>
            <p style={{ fontSize: 14 }}>Creá tu primer tablero para empezar</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => router.push(`/boards/${board.id}`)}
                style={{ position: "relative", backgroundColor: board.color, borderRadius: 12, padding: 16, height: 112, cursor: "pointer", display: "flex", alignItems: "flex-end" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{board.title}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}