import type React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SiteLogoIconProps {
  className?: string;
}

const SiteLogoIcon: React.FC<SiteLogoIconProps> = ({ className }) => {
  // Припускаємо, що логотип називається logo.png і знаходиться в теці /public
  // Якщо ваш файл називається інакше, або знаходиться в підтеці, оновіть цей шлях.
  // Наприклад, якщо файл /public/images/my-logo.png, шлях буде '/images/my-logo.png'
  const logoPath = '/logo.png'; 

  return (
    <div className={cn("relative", className)}>
      <Image
        src={logoPath}
        alt="ReefUA Logo"
        fill
        sizes="48px" // Максимальний розмір, в якому логотип відображається (h-12 w-12 -> 48px)
        priority // Пріоритетне завантаження для логотипу в хедері
      />
    </div>
  );
};

export default SiteLogoIcon;
