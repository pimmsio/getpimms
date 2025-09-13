// Avatar-related TypeScript interfaces and types

export interface Theme {
  bg: string;
  fg: string;
}

export interface AvatarProps {
  theme: Theme;
  size: {
    width: number;
    height: number;
  };
  head: {
    width: number;
    height: number;
    top: number;
  };
  shoulders: {
    width: number;
    height: number;
    top: number;
  };
}

export interface SoberAvatarComponentProps {
  avatarProps: AvatarProps;
}

export interface SkinWeight {
  hex: string;
  pct: number;
}

export type Gender = 'male' | 'female';
