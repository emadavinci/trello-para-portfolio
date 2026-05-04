export interface Board {
  id: string;
  title: string;
  color: string;
  userId: string;
  createdAt: number;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  order: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  order: number;
  labels?: Label[];
}

export interface Label {
  id: string;
  text: string;
  color: string;
}