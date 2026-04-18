import { query } from '../connection';
import { FounderProfile } from '../../types';

export const createFounderProfile = async (
  userId: string,
  companyName: string,
  domain: string,
  fundingStage: string,
  valuation: number,
  description?: string,
  socialLinks?: Record<string, string>
): Promise<FounderProfile> => {
  const result = await query<FounderProfile>(
    `INSERT INTO founder_profiles
     (user_id, company_name, domain, funding_stage, valuation, description, social_links)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, companyName, domain, fundingStage, valuation, description || null, JSON.stringify(socialLinks || {})]
  );
  return result.rows[0];
};

export const getFounderProfile = async (userId: string): Promise<FounderProfile | null> => {
  const result = await query<FounderProfile>(
    'SELECT * FROM founder_profiles WHERE user_id = $1',
    [userId]
  );
  if (result.rows[0] && typeof result.rows[0].social_links === 'string') {
    result.rows[0].social_links = JSON.parse(result.rows[0].social_links as any);
  }
  return result.rows[0] || null;
};

export const updateFounderProfile = async (
  userId: string,
  updates: Partial<{
    company_name: string;
    domain: string;
    funding_stage: string;
    valuation: number;
    description: string;
    social_links: Record<string, string>;
  }>
): Promise<FounderProfile> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'social_links') {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }
  });

  if (fields.length === 0) {
    const profile = await getFounderProfile(userId);
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await query<FounderProfile>(
    `UPDATE founder_profiles
     SET ${fields.join(', ')}
     WHERE user_id = $${paramCount}
     RETURNING *`,
    values
  );

  if (result.rows[0] && typeof result.rows[0].social_links === 'string') {
    result.rows[0].social_links = JSON.parse(result.rows[0].social_links as any);
  }
  return result.rows[0];
};

export const getAllFounderProfiles = async (): Promise<FounderProfile[]> => {
  const result = await query<FounderProfile>(
    'SELECT * FROM founder_profiles ORDER BY created_at DESC'
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string'
      ? JSON.parse(row.social_links as any)
      : row.social_links
  }));
};

