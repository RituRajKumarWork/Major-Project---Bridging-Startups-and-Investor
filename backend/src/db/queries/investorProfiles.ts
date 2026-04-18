import { query } from '../connection';
import { InvestorProfile } from '../../types';

export const createInvestorProfile = async (
  userId: string,
  name: string,
  email: string,
  phone: string,
  domain?: string,
  stageInterest?: string,
  description?: string,
  logoUrl?: string,
  website?: string
): Promise<InvestorProfile> => {
  const result = await query<InvestorProfile>(
    `INSERT INTO investor_profiles
     (user_id, name, email, phone, domain, stage_interest, description, logo_url, website)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, name, email, phone, domain || null, stageInterest || null, description || null, logoUrl || null, website || null]
  );
  return result.rows[0];
};

export const getInvestorProfile = async (userId: string): Promise<InvestorProfile | null> => {
  const result = await query<InvestorProfile>(
    'SELECT * FROM investor_profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

export const updateInvestorProfile = async (
  userId: string,
  updates: Partial<{
    name: string;
    email: string;
    phone: string;
    domain: string;
    stage_interest: string;
    description: string;
    logo_url: string;
    website: string;
  }>
): Promise<InvestorProfile> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    const profile = await getInvestorProfile(userId);
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await query<InvestorProfile>(
    `UPDATE investor_profiles
     SET ${fields.join(', ')}
     WHERE user_id = $${paramCount}
     RETURNING *`,
    values
  );
  return result.rows[0];
};

export const getAllInvestorProfiles = async (): Promise<InvestorProfile[]> => {
  const result = await query<InvestorProfile>(
    'SELECT * FROM investor_profiles ORDER BY created_at DESC'
  );
  return result.rows;
};

