import './globals.css';

export const metadata = {
  title: 'Bowling Poker Digiplay',
  description: 'Digital card game companion for bowling leagues.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
