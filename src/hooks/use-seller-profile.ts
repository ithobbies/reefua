
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/functions/src/types';

export function useSellerProfile(sellerUid: string) {
  const [sellerProfile, setSellerProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerUid) {
      setLoading(false);
      return;
    }

    const fetchSellerProfile = async () => {
      setLoading(true);
      const sellerRef = doc(db, 'users', sellerUid);
      try {
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSellerProfile(sellerSnap.data() as User);
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [sellerUid]);

  return { sellerProfile, loading };
}
