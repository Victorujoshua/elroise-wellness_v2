export type PilatesPackage = {
  name: string
  price: string
  count: number
}

export type Service = {
  id: string
  name: string
  description: string
  duration: string
  price: string
  packagePrice?: string
  packages?: PilatesPackage[]
  category?: 'laser' | 'pilates' | 'other'
}

export const laserServices: Service[] = [
  {
    id: 'chin-upper-lip',
    name: 'Chin / Upper Lip',
    description:
      'Targeted laser hair reduction for the chin and upper lip area for a smooth, refined finish.',
    duration: '15 MIN',
    price: '45,000',
    packagePrice: '175,000',
  },
  {
    id: 'jaw',
    name: 'Jaw',
    description:
      'Precision treatment for the jawline area, ensuring clean and clear skin contours.',
    duration: '20 MIN',
    price: '60,000',
    packagePrice: '225,000',
  },
  {
    id: 'lower-face',
    name: 'Lower Face',
    description:
      'Comprehensive treatment including Chin, Upper Lip, and Jaw for a complete facial refresh.',
    duration: '30 MIN',
    price: '70,000',
    packagePrice: '300,000',
  },
  {
    id: 'under-arm',
    name: 'Under Arm',
    description:
      'Efficient and gentle laser hair reduction for the underarm area, perfect for daily ease.',
    duration: '20 MIN',
    price: '55,000',
    packagePrice: '225,000',
  },
  {
    id: 'bikini',
    name: 'Bikini',
    description:
      'Standard bikini line treatment designed for comfort and long-lasting results.',
    duration: '30 MIN',
    price: '70,000',
    packagePrice: '300,000',
  },
  {
    id: 'brazilian',
    name: 'Brazilian',
    description:
      'Full Brazilian laser treatment for complete confidence and smooth skin.',
    duration: '45 MIN',
    price: '95,000',
    packagePrice: '425,000',
  },
  {
    id: 'full-legs',
    name: 'Full Legs',
    description:
      'Total leg treatment from ankle to thigh, providing silky smooth skin across the entire surface.',
    duration: '60 MIN',
    price: '125,000',
    packagePrice: '500,000',
  },
  {
    id: 'full-arms',
    name: 'Full Arms',
    description:
      'Complete arm treatment for a clean, hair-free look from shoulder to wrist.',
    duration: '45 MIN',
    price: '100,000',
    packagePrice: '425,000',
  },
]

export const pilatesServices: Service[] = [
  {
    id: 'reformer-pilates',
    name: 'Reformer Pilates',
    description:
      'Dynamic resistance training on the reformer to build core strength, flexibility, and lean muscle.',
    duration: '55 MIN',
    price: '20,000',
    packages: [
      { name: '5 Classes', price: '80,000', count: 5 },
      { name: '10 Classes', price: '160,000', count: 10 },
      { name: '20 Classes', price: '320,000', count: 20 },
    ],
  },
  {
    id: 'private-pilates',
    name: 'Private Session',
    description:
      'One-on-one tailored instruction focusing on your specific goals and postural needs.',
    duration: '60 MIN',
    price: '35,000',
    packagePrice: '300,000',
  },
  {
    id: 'duet-pilates',
    name: 'Duet Session',
    description:
      'Semi-private instruction for two people. Perfect for friends or partners working together.',
    duration: '60 MIN',
    price: '75,000',
    packagePrice: '220,000',
  },
]

export const allServices: Service[] = [...laserServices, ...pilatesServices]

export const featuredServices: Service[] = [
  laserServices.find(s => s.id === 'lower-face') as Service,
  pilatesServices.find(s => s.id === 'reformer-pilates') as Service,
  laserServices.find(s => s.id === 'brazilian') as Service,
]
