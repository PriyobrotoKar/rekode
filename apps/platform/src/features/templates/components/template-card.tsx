import { Template } from '@rekode/types/client/proto/template';
import { IconCode } from '@tabler/icons-react';

interface TemplateCardProps {
  template: Template;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TemplateCard({ template, isSelected = false, onClick }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="data-[active=true]:border-primary data-[active=true]:bg-primary/20 bg-card flex w-full flex-col items-start gap-4 overflow-hidden rounded-sm border p-4 text-left transition-colors hover:border-white/30"
      data-active={isSelected}
    >
      <div>
        <IconCode />
      </div>
      <span>{template.slug}</span>
    </button>
  );
}
