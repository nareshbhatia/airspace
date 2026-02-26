import { MoonIcon, SunIcon } from 'lucide-react';

import { useTheme } from '../../providers/ThemeProvider/useTheme';
import { Button } from '../ui/button';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button onClick={handleClick} size="icon" variant="outline">
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}
