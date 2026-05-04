import { db } from "./firebase";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy, updateDoc
} from "firebase/firestore";
import { Board, Column, Card } from "@/types";

// Boards
export const createBoard = async (userId: string, title: string, color: string) => {
  return await addDoc(collection(db, "boards"), {
    title, color, userId, createdAt: Date.now(),
  });
};

export const getBoards = async (userId: string): Promise<Board[]> => {
  const q = query(collection(db, "boards"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Board));
};

export const deleteBoard = async (boardId: string) => {
  await deleteDoc(doc(db, "boards", boardId));
};

// Columns
export const createColumn = async (boardId: string, title: string, order: number) => {
  return await addDoc(collection(db, "columns"), { title, boardId, order });
};

export const getColumns = async (boardId: string): Promise<Column[]> => {
  const q = query(collection(db, "columns"), where("boardId", "==", boardId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Column));
};

export const updateColumn = async (columnId: string, data: Partial<Column>) => {
  await updateDoc(doc(db, "columns", columnId), data);
};

export const deleteColumn = async (columnId: string) => {
  await deleteDoc(doc(db, "columns", columnId));
};

// Cards
export const createCard = async (boardId: string, columnId: string, title: string, order: number) => {
  return await addDoc(collection(db, "cards"), { title, boardId, columnId, order, description: "" });
};

export const getCards = async (boardId: string): Promise<Card[]> => {
  const q = query(collection(db, "cards"), where("boardId", "==", boardId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
};

export const updateCard = async (cardId: string, data: Partial<Card>) => {
  await updateDoc(doc(db, "cards", cardId), data);
};

export const deleteCard = async (cardId: string) => {
  await deleteDoc(doc(db, "cards", cardId));
};