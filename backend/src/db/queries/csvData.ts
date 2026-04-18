import { query } from '../connection';
import { CSVFile, CSVData } from '../../types';

export const createCSVFile = async (
  founderId: string,
  filename: string,
  metadata?: Record<string, any>
): Promise<CSVFile> => {
  const result = await query<CSVFile>(
    `INSERT INTO csv_files (founder_id, filename, metadata)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [founderId, filename, JSON.stringify(metadata || {})]
  );
  return result.rows[0];
};

export const getCSVFilesByFounder = async (founderId: string): Promise<CSVFile[]> => {
  const result = await query<CSVFile>(
    'SELECT * FROM csv_files WHERE founder_id = $1 ORDER BY uploaded_at DESC',
    [founderId]
  );
  return result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string'
      ? JSON.parse(row.metadata as any)
      : row.metadata
  }));
};

export const deleteCSVFile = async (fileId: string, founderId: string): Promise<boolean> => {
  const result = await query(
    'DELETE FROM csv_files WHERE id = $1 AND founder_id = $2',
    [fileId, founderId]
  );
  return (result.rowCount || 0) > 0;
};

export const createCSVData = async (
  founderId: string,
  csvFileId: string | null,
  month: Date,
  revenue: number,
  expenses: number,
  profit: number
): Promise<CSVData> => {
  const result = await query<CSVData>(
    `INSERT INTO csv_data (founder_id, csv_file_id, month, revenue, expenses, profit)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [founderId, csvFileId, month, revenue, expenses, profit]
  );
  return result.rows[0];
};

export const getCSVDataByFounder = async (
  founderId: string,
  limit?: number
): Promise<CSVData[]> => {
  let sql = 'SELECT * FROM csv_data WHERE founder_id = $1 ORDER BY month ASC';
  const params: any[] = [founderId];

  if (limit) {
    sql += ' LIMIT $2';
    params.push(limit);
  }

  const result = await query<CSVData>(sql, params);
  return result.rows;
};

export const deleteCSVDataByFile = async (csvFileId: string): Promise<boolean> => {
  const result = await query(
    'DELETE FROM csv_data WHERE csv_file_id = $1',
    [csvFileId]
  );
  return (result.rowCount || 0) > 0;
};

export const getCSVDataByFile = async (csvFileId: string): Promise<CSVData[]> => {
  const result = await query<CSVData>(
    'SELECT * FROM csv_data WHERE csv_file_id = $1 ORDER BY month ASC',
    [csvFileId]
  );
  return result.rows;
};

