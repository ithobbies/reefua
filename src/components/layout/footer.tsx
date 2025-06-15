import type React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Benthos Bazaar. Всі права захищені.</p>
        <p>Розроблено з любов'ю до морських рифів.</p>
      </div>
    </footer>
  );
};

export default Footer;
