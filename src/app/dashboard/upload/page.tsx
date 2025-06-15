import CsvUploadWidget from '@/components/dashboard/csv-upload';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Масове завантаження - Панель Продавця',
  description: 'Завантажте CSV файл для масового додавання лотів.',
};

export default function DashboardCsvUploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-headline font-semibold text-primary mb-6">Масове завантаження лотів</h1>
      <CsvUploadWidget />
    </div>
  );
}
