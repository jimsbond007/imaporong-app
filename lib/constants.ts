export const BARANGAY = {
  name: 'Barangay Maporong',
  shortName: 'Maporong',
  municipality: 'Oas',
  province: 'Albay',
  region: 'Bicol Region',
  address: 'Barangay Maporong, Municipality of Oas, Province of Albay',
  contactPlaceholder: 'Contact details to be provided by the barangay.',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Barangay+Maporong%2C+Oas%2C+Albay',
} as const;

export type ServiceIcon =
  | 'clearance'
  | 'indigency'
  | 'residency'
  | 'id'
  | 'business';

export interface Service {
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: ServiceIcon;
}

/**
 * The five document types that already exist in the service_requests flow.
 * Descriptions explain the usual purpose only. They do not claim official
 * requirements or processing times — staff confirm those on review.
 */
export const SERVICES: Service[] = [
  {
    slug: 'barangay-clearance',
    name: 'Barangay Clearance',
    short: 'For work, travel, and other transactions.',
    description:
      'Proof that you are a resident in good standing, commonly requested for employment, travel, and other official transactions.',
    icon: 'clearance',
  },
  {
    slug: 'certificate-of-indigency',
    name: 'Certificate of Indigency',
    short: 'For medical, school, or social assistance.',
    description:
      'Proof of low income for medical, educational, or social assistance requirements. Barangay staff review each request.',
    icon: 'indigency',
  },
  {
    slug: 'residency-certificate',
    name: 'Residency Certificate',
    short: 'Proof of address in Maporong.',
    description:
      'Confirms that you live in Barangay Maporong. Often used for school, work, and government requirements.',
    icon: 'residency',
  },
  {
    slug: 'barangay-id',
    name: 'Barangay ID Card',
    short: 'Official resident identification.',
    description:
      'Resident identification issued after the barangay verifies your record. Your verified profile can also print a digital copy.',
    icon: 'id',
  },
  {
    slug: 'business-clearance',
    name: 'Business Clearance',
    short: 'For sari-sari stores and small businesses.',
    description:
      'For sari-sari stores, home-based businesses, and other livelihood operations inside the barangay.',
    icon: 'business',
  },
];

export const NAV_LINKS = [
  { label: 'Home', href: '/#top' },
  { label: 'Services', href: '/#services' },
  { label: 'Community', href: '/#community' },
  { label: 'Updates', href: '/#announcements' },
  { label: 'About', href: '/#about' },
] as const;
