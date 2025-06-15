'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const CsvUploadWidget = () => {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: 'Файл не обрано',
        description: 'Будь ласка, оберіть CSV файл для завантаження.',
        variant: 'destructive',
      });
      return;
    }
    // Placeholder for actual upload logic
    toast({
      title: 'Файл завантажено (симуляція)',
      description: `Файл "${file.name}" було успішно "завантажено".`,
    });
    setFile(null); 
    // Reset file input if possible (might need to clear via form reset or ref)
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = "";

  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Масове завантаження лотів</CardTitle>
        <CardDescription>Завантажте CSV файл для додавання кількох лотів одночасно.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Натисніть щоб завантажити</span> або перетягніть файл
                </p>
                <p className="text-xs text-muted-foreground">CSV (Макс. 2MB)</p>
              </div>
              <Input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
            {file && <p className="mt-2 text-sm text-muted-foreground">Обраний файл: {file.name}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={!file}>
            Завантажити CSV
          </Button>
          <Button variant="link" type="button" className="w-full text-primary">
            Завантажити шаблон CSV
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CsvUploadWidget;
