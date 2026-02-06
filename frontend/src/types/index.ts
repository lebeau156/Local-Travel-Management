export interface User {
  id: number;
  email: string;
  role: 'inspector' | 'supervisor' | 'fleet_manager' | 'admin';
}

export interface Profile {
  id?: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  middle_initial?: string;
  phone?: string;
  home_address?: string;
  duty_station?: string;
  employee_id?: string;
  travel_auth_no?: string;
  agency?: string;
  office?: string;
  position?: string;
  state?: string;
  circuit?: string;
  assigned_supervisor_id?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_license?: string;
  mileage_rate?: number;
  per_diem_rate?: number;
  account_number?: string;
  signature_data?: string;
  signature_type?: string;
}

export interface Trip {
  id: number;
  user_id: number;
  date: string;
  from_address: string;
  to_address: string;
  site_name?: string;
  purpose?: string;
  miles_calculated: number;
  route_data?: string;
  departure_time?: string;
  return_time?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Voucher {
  id: number;
  user_id: number;
  month: number;
  year: number;
  status: 'draft' | 'submitted' | 'supervisor_approved' | 'fleet_approved' | 'rejected';
  total_miles: number;
  total_amount: number;
  submitted_at?: string;
  supervisor_id?: number;
  supervisor_approved_at?: string;
  fleet_manager_id?: number;
  fleet_approved_at?: string;
  rejection_reason?: string;
  pdf_url?: string;
  created_at?: string;
  updated_at?: string;
}
