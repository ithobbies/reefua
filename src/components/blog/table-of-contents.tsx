
'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface TableOfContentsProps {
  contentSelector: string; // ID or class of the content container
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ contentSelector }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const elements = container.querySelectorAll('h2, h3');
    const headingData: Heading[] = [];

    elements.forEach((elem, index) => {
      if (!elem.id) {
        elem.id = `heading-${index}`;
      }
      headingData.push({
        id: elem.id,
        text: elem.textContent || '',
        level: parseInt(elem.tagName.substring(1)),
      });
    });

    setHeadings(headingData);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, [contentSelector]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border p-6 sticky top-24">
      <div className="flex items-center gap-2 mb-4 font-bold text-lg">
         <List className="h-5 w-5 text-primary" />
         <span>Зміст статті</span>
      </div>
      <nav>
        <ul className="space-y-3 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: (heading.level - 2) * 16 }}
              className={cn(
                "transition-colors hover:text-primary leading-snug",
                activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(`#${heading.id}`)?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
