import { UserController } from '@/features/user/api';
import appCss from '@rekode/ui/globals.css?url';
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';

import { Toaster } from '@rekode/ui/components/sonner';

export const Route = createRootRoute({
  beforeLoad: async () => {
    try {
      const { user } = await UserController.getSelf();
      return { user };
    } catch {
      return { user: null };
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Rekode',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="dark selection:bg-primary/20 font-sans wrap-anywhere antialiased">
        {children}
        <Toaster richColors />
        <Scripts />
      </body>
    </html>
  );
}
