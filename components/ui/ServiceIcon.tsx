import type { ServiceIcon } from '@/lib/constants';
import {
  FileTextIcon,
  HandHeartIcon,
  HomeIcon,
  IdCardIcon,
  StoreIcon,
  type IconProps,
} from '@/components/ui/icons';

const map: Record<ServiceIcon, (props: IconProps) => React.ReactElement> = {
  clearance: FileTextIcon,
  indigency: HandHeartIcon,
  residency: HomeIcon,
  id: IdCardIcon,
  business: StoreIcon,
};

export function ServiceIcon({ icon, ...props }: IconProps & { icon: ServiceIcon }) {
  const Component = map[icon] ?? FileTextIcon;
  return <Component {...props} />;
}
