export type UserRole = 'founder' | 'investor';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface FounderProfile {
  user_id: string;
  company_name: string;
  domain: string;
  funding_stage: string;
  valuation: number;
  description?: string;
  social_links: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface InvestorProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  domain?: string;
  stage_interest?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Connection {
  id: string;
  founder_id: string;
  investor_id: string;
  status: ConnectionStatus;
  initiated_by?: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
}

export interface CSVFile {
  id: string;
  founder_id: string;
  filename: string;
  uploaded_at: Date;
  metadata: Record<string, any>;
}

export interface CSVData {
  id: string;
  founder_id: string;
  csv_file_id?: string;
  month: Date;
  revenue: number;
  expenses: number;
  profit: number;
  created_at: Date;
}

export interface JWTUser {
  id: string;
  email: string;
  role: UserRole;
}

