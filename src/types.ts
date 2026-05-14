import { Timestamp } from "firebase/firestore";

export enum LoanStatus {
  ACTIVE = "active",
  RETURNED = "returned",
  OVERDUE = "overdue",
}

export enum BookStatus {
  AVAILABLE = "available",
  LOANED = "loaned",
  DAMAGED = "damaged",
  LOST = "lost",
}

export interface Book {
  id?: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  coverUrl?: string;
  createdAt: Timestamp;
}

export interface Student {
  id?: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

export interface Loan {
  id?: string;
  bookId: string;
  studentId: string;
  loanDate: Timestamp;
  dueDate: Timestamp;
  returnDate?: Timestamp;
  status: LoanStatus;
  notes?: string;
  // Extended data for UI
  bookTitle?: string;
  studentName?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
