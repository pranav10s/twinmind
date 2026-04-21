import { SettingsProvider } from '@/app/context';
import './globals.css';

export const metadata = {
  title: 'TwinMind — Live Meeting Copilot',
  description: 'Real-time AI suggestions for your meetings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
