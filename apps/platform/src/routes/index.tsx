import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <main>
      <Button>Click me!</Button>
    </main>
  );
}
