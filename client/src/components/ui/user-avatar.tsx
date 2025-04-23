import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    fullName?: string;
    email?: string;
    username?: string;
  };
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const name = user.fullName || user.username || user.email || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Avatar className={sizeClass[size]}>
      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
