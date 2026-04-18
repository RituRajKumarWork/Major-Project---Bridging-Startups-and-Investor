'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataLabChart } from '@/components/founder/DataLabChart';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface CSVFile {
  id: string;
  filename: string;
  uploaded_at: string;
}

interface CSVData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export default function DataLabPage() {
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [data, setData] = useState<CSVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filesRes, dataRes] = await Promise.all([
        api.get('/api/founders/csv'),
        api.get('/api/founders/csv/data'),
      ]);
      setFiles(filesRes.data.files || []);
      setData(dataRes.data.data || []);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('data', file);

      await api.post('/api/founders/csv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('CSV uploaded successfully');
      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/api/founders/csv/${fileId}`);
      toast.success('File deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete file');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Lab</CardTitle>
          <CardDescription>Upload and visualize your financial data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="max-w-xs"
            />
            <Button disabled={uploading} onClick={() => document.querySelector('input[type="file"]')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            CSV format: Month (YYYY-MM-DD), Revenue, Expenses, Profit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <DataLabChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground">No files uploaded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.filename}</TableCell>
                    <TableCell>
                      {format(new Date(file.uploaded_at), 'PPp')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

