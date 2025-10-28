import { cn } from "@dub/utils";

type User = {
  id?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
};

export function getUserAvatarUrl(user?: User | null) {
  if (user?.image) return user.image;

  // Return null to indicate we should use sober avatar instead
  return null;
}

export function Avatar({
  user = {},
  className,
}: {
  user?: User;
  className?: string;
}) {
  if (!user) {
    return (
      <div
        className={cn(
          "h-10 w-10 animate-pulse rounded-full border border-neutral-300 bg-neutral-100",
          className,
        )}
      />
    );
  }

  const avatarUrl = getUserAvatarUrl(user);

  if (avatarUrl) {
    return (
      <img
        alt={`Avatar for ${user.name || user.email}`}
        referrerPolicy="no-referrer"
        src={avatarUrl}
        className={cn(
          "h-10 w-10 rounded-full border border-neutral-300",
          className,
        )}
        draggable={false}
      />
    );
  }

  // Use sober avatar for user profiles (more professional look)
  const seed = user.id || user.email || 'anonymous';
  const soberAvatarUrl = `https://app.pimms.io/api/og/avatar?sober=true&seed=${encodeURIComponent(seed)}${user.name ? `&name=${encodeURIComponent(user.name)}` : ''}`;
  
  return (
    <img
      alt={`Avatar for ${user.name || user.email || 'Anonymous'}`}
      referrerPolicy="no-referrer"
      src={soberAvatarUrl}
      className={cn(
        "h-10 w-10 rounded-full border border-neutral-300",
        className,
      )}
      draggable={false}
    />
  );
}

export function TokenAvatar({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  // Use sober avatar for tokens as well
  const soberAvatarUrl = `https://app.pimms.io/api/og/avatar?sober=true&seed=${encodeURIComponent(id)}`;
  
  return (
    <img
      alt="Token avatar"
      referrerPolicy="no-referrer"
      src={soberAvatarUrl}
      className={cn("h-10 w-10 rounded-full border border-neutral-300", className)}
      draggable={false}
    />
  );
}
