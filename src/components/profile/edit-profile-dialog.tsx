
'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions, app } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropper } from '@/components/ui/image-cropper';

interface EditProfileDialogProps {
  children: React.ReactNode;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ children }) => {
  const { firestoreUser, user } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(firestoreUser?.username || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(firestoreUser?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Cropper state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrcToCrop, setImgSrcToCrop] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrcToCrop(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropConfirm = (croppedFile: File) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setCropModalOpen(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    let photoURL = firestoreUser?.photoURL;

    if (avatarFile) {
      setIsUploading(true);
      try {
        const storage = getStorage(app);
        // Use a consistent name for the avatar to overwrite it
        const avatarRef = ref(storage, `user-avatars/${user.uid}/avatar.jpg`);
        const snapshot = await uploadBytes(avatarRef, avatarFile);
        photoURL = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading avatar:", error);
        toast({ variant: 'destructive', title: 'Помилка завантаження', description: 'Не вдалося завантажити новий аватар.' });
        setIsUploading(false);
        setIsSaving(false);
        return;
      }
      setIsUploading(false);
    }
    
    try {
      const updateUserProfile = httpsCallable(functions, 'updateUserProfile');
      await updateUserProfile({ username, photoURL });
      toast({ title: 'Успішно', description: 'Ваш профіль оновлено.' });
      setOpen(false); // Close the dialog on success
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: 'Помилка', description: error.message || 'Не вдалося оновити профіль.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редагувати профіль</DialogTitle>
            <DialogDescription>
              Змініть ваше ім'я та аватар. Натисніть "Зберегти", коли завершите.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback>{username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Ім'я
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Завантаження...' : isSaving ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {imgSrcToCrop && (
        <ImageCropper
          isOpen={cropModalOpen}
          imgSrc={imgSrcToCrop}
          aspect={1}
          circularCrop={true}
          onClose={() => setCropModalOpen(false)}
          onConfirm={handleCropConfirm}
          originalFileName={originalFileName}
        />
      )}
    </>
  );
};
