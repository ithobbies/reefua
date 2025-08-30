
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop as CropType } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageCropperProps {
  isOpen: boolean;
  imgSrc: string;
  aspect: number;
  circularCrop?: boolean;
  onClose: () => void;
  onConfirm: (croppedImageFile: File) => void;
  originalFileName: string;
}

// Helper function to create a cropped image from a canvas
function getCroppedImg(image: HTMLImageElement, crop: CropType, fileName: string): Promise<File> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Failed to get 2D context'));
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                // Use the original file name for the cropped image
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                resolve(file);
            },
            'image/jpeg',
            0.95
        );
    });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  imgSrc,
  aspect,
  circularCrop = false,
  onClose,
  onConfirm,
  originalFileName,
}) => {
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const handleCropConfirm = async () => {
    if (completedCrop && imgRef.current) {
        try {
            const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, originalFileName);
            onConfirm(croppedImageFile);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Помилка',
                description: 'Не вдалося обрізати зображення. Спробуйте інше фото.',
            });
        }
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Налаштування зображення</DialogTitle>
          <DialogDescription>
            Виберіть область, яку ви хочете використати. Ви можете масштабувати та пересувати зображення.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button onClick={handleCropConfirm}><Crop className="mr-2 h-4 w-4" /> Застосувати</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
