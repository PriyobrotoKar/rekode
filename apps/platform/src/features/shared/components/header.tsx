import { logoutMutationOptions } from '@/features/auth/queries';
import {
  IconBell,
  IconLayoutGrid,
  IconLogout,
  type IconProps,
  IconSettings,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouteContext, useRouter } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@rekode/ui/components/avatar';
import { Button } from '@rekode/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@rekode/ui/components/dropdown-menu';

interface HeaderProps {
  Icon?: React.FC<IconProps>;
  title?: string;
}

export function Header({ Icon = IconLayoutGrid, title = 'Projects' }: HeaderProps) {
  return (
    <header className="flex h-(--header-height) items-center justify-between border-b p-2">
      <div className="flex items-center gap-2">
        <div className="bg-muted flex size-7 items-center justify-center rounded-sm">
          <Icon className="size-4" />
        </div>
        <span className="text-md-medium">{title}</span>
      </div>

      <div className="flex gap-2">
        <Button variant={'outline'} size={'icon-sm'}>
          <IconBell />
        </Button>
        <ProfileDropdown />
      </div>
    </header>
  );
}

function ProfileDropdown() {
  const router = useRouter();
  const { user } = useRouteContext({
    from: '__root__',
  });

  const mutation = useMutation({
    ...logoutMutationOptions,
    onSuccess: () => {
      router.invalidate();
    },
  });

  const handleLogout = async () => {
    mutation.mutate();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size={'icon-sm'} variant={'ghost'}>
            <Avatar>
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? undefined} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent className={'w-64 space-y-2'}>
        <DropdownMenuGroup>
          <DropdownMenuItem className={'bg-accent p-2'}>
            <Avatar size="lg">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? undefined} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-md">{user.name}</span>
              <span className="text-muted-foreground text-xs">{user.email}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconSettings /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <IconLogout /> Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
