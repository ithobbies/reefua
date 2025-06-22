
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Lot } from '@/functions/src/types';
import { Loader2 } from 'lucide-react';
import { LotForm } from '@/components/dashboard/lot-form';

export default function EditLotPage() {
  const params = useParams();
  const lotId = params.id as string;
  
  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) {
        setLoading(false);
        setError("Не вказано ID лота.");
        return;
    };

    const fetchLot = async () => {
      try {
        const lotRef = doc(db, 'lots', lotId);
        const lotSnap = await getDoc(lotRef);

        if (lotSnap.exists()) {
          const lotData = { id: lotSnap.id, ...lotSnap.data() } as Lot;
          setLot(lotData);
        } else {
          setError('Лот не знайдено.');
        }
      } catch (err) {
        console.error("Error fetching lot:", err);
        setError('Помилка завантаження даних лота.');
      } finally {
        setLoading(false);
      }
    };

    fetchLot();
  }, [lotId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }
  
  return <LotForm existingLot={lot} />;
}
