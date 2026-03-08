import type { ReactNode } from 'react';

interface FormHeaderProps {
  title: string;
  description?: ReactNode;
}

function FormHeader({ title, description }: FormHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-foreground text-5xl leading-snug">{title}</h1>
      <p className="text-muted-foreground text-md text-pretty">{description}</p>
    </div>
  );
}

export { FormHeader };
