import { SendIcon } from 'lucide-react';
import { Link } from 'react-router';

import { siteConfig } from '../../config/SiteConfig';
import { buttonVariants } from '../ui/button';

export function HeaderBrand() {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/"
        className={buttonVariants({ variant: 'default', size: 'icon' })}
      >
        <SendIcon />
      </Link>
      <span className="text-base font-medium tracking-wide">
        {siteConfig.name}
      </span>
    </div>
  );
}
