"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { getColumns, createColumn, deleteColumn, getCards, createCard, deleteCard, updateCard } from "@/lib/firestore";
import { Column, Card } from "@/types";
import { Plus, X, Trash2, ArrowLeft, LogOut } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function SortableCard({ card, onDelete }: { card: Card; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, backgroundColor: "white", borderRadius: 8, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.1)", position: "relative", cursor: "grab" }}
      {...attributes} {...listeners}
    >
      <p style={{ fontSize: 14, color: "#1a1a1a", paddingRight: 16 }}>{card.title}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function DroppableColumn({ col, colCards, onDeleteColumn, onDeleteCard, addingCardCol, setAddingCardCol, newCardTitle, setNewCardTitle, onAddCard }: {
  col: Column; colCards: Card[]; onDeleteColumn: (id: string) => void; onDeleteCard: (id: string) => void;
  addingCardCol: string | null; setAddingCardCol: (id: string | null) => void;
  newCardTitle: string; setNewCardTitle: (v: string) => void; onAddCard: (colId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.id });
  return (
    <div style={{ backgroundColor: "#ebecf0", borderRadius: 12, width: 256, flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" }}>
        <h3 style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{col.title}</h3>
        <button onClick={() => onDeleteColumn(col.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
          <Trash2 size={14} />
        </button>
      </div>

      <SortableContext items={colCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", minHeight: 40 }}>
          {colCards.map((card) => (
            <SortableCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </div>
      </SortableContext>

      <div style={{ padding: 8 }}>
        {addingCardCol === col.id ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Título de la card"
              rows={2}
              autoFocus
              style={{ width: "100%", border: "1px solid #e2e2e2", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAddCard(col.id)} style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "none", cursor: "pointer" }}>
                Agregar
              </button>
              <button onClick={() => { setAddingCardCol(null); setNewCardTitle(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b6b6b" }}>
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setAddingCardCol(col.id); setNewCardTitle(""); }}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b6b6b", background: "none", border: "none", cursor: "pointer", width: "100%", padding: "6px 8px", borderRadius: 8, fontSize: 14 }}
          >
            <Plus size={14} />
            Agregar card
          </button>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { id: boardId } = useParams() as { id: string };

  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [ready, setReady] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [showColForm, setShowColForm] = useState(false);
  const [addingCardCol, setAddingCardCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (!boardId) return;
    Promise.all([getColumns(boardId), getCards(boardId)])
      .then(([cols, cds]) => { setColumns(cols); setCards(cds); setReady(true); })
      .catch(console.error);
  }, [boardId]);

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    const ref = await createColumn(boardId, newColTitle.trim(), columns.length);
    setColumns((prev) => [...prev, { id: ref.id, title: newColTitle.trim(), boardId, order: columns.length }]);
    setNewColTitle(""); setShowColForm(false);
  };

  const handleDeleteColumn = async (colId: string) => {
    await deleteColumn(colId);
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setCards((prev) => prev.filter((c) => c.columnId !== colId));
  };

  const handleAddCard = async (columnId: string) => {
    if (!newCardTitle.trim()) return;
    const colCards = cards.filter((c) => c.columnId === columnId);
    const ref = await createCard(boardId, columnId, newCardTitle.trim(), colCards.length);
    setCards((prev) => [...prev, { id: ref.id, title: newCardTitle.trim(), columnId, boardId, order: colCards.length }]);
    setNewCardTitle(""); setAddingCardCol(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    const overColumn = columns.find((c) => c.id === overId);
    const overCard = cards.find((c) => c.id === overId);
    const targetColumnId = overColumn?.id ?? overCard?.columnId;

    if (targetColumnId && activeCard.columnId !== targetColumnId) {
      setCards((prev) => prev.map((c) => c.id === activeId ? { ...c, columnId: targetColumnId } : c));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    setActiveCard(null);
    const card = cards.find((c) => c.id === active.id);
    if (card) await updateCard(card.id, { columnId: card.columnId });
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1d4ed8" }}>
      <div style={{ width: 24, height: 24, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1d4ed8", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/boards")} style={{ color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Tablero</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.photoURL && <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%" }} />}
          <button onClick={logout} style={{ color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer" }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ flex: 1, overflowX: "auto", padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {columns.map((col) => {
              const colCards = cards.filter((c) => c.columnId === col.id).sort((a, b) => a.order - b.order);
              return (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  colCards={colCards}
                  onDeleteColumn={handleDeleteColumn}
                  onDeleteCard={handleDeleteCard}
                  addingCardCol={addingCardCol}
                  setAddingCardCol={setAddingCardCol}
                  newCardTitle={newCardTitle}
                  setNewCardTitle={setNewCardTitle}
                  onAddCard={handleAddCard}
                />
              );
            })}

            <div style={{ flexShrink: 0, width: 256 }}>
              {showColForm ? (
                <div style={{ backgroundColor: "#ebecf0", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                    placeholder="Nombre de la columna"
                    autoFocus
                    style={{ width: "100%", border: "1px solid #e2e2e2", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddColumn} style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "none", cursor: "pointer" }}>Agregar</button>
                    <button onClick={() => { setShowColForm(false); setNewColTitle(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b6b6b" }}><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowColForm(true)} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", color: "white", padding: "12px 16px", borderRadius: 12, width: "100%", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
                  <Plus size={16} /> Agregar columna
                </button>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div style={{ backgroundColor: "white", borderRadius: 8, padding: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontSize: 14, color: "#1a1a1a", cursor: "grabbing", width: 240 }}>
              {activeCard.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}