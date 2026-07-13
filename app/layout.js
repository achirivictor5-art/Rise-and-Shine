import './globals.css';
import AuthGate from '../components/AuthGate';

export const metadata = {
  title: 'Rise and Shine — Staff Portal',
  description: 'Internal pupil payment records portal for Rise and Shine Nursery and Primary School',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
