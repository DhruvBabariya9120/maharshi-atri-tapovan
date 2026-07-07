/**
 * All MAT website content, sourced from MAT_Website_Content_Updated.pdf.
 * Structured so a parallel `gu` (Gujarati) translation can be layered in later.
 * TODO markers = content the school must still supply; rendered as clear placeholders.
 */
export const TODO = 'TODO' as const
export const site = {
  name: 'Maharshi Atri Tapovan',
  shortName: 'MAT',
  tagline: 'Modern Education, Timeless Values',
  established: 2003,
  board: 'Gujarat Board (GSEB)',
  medium: 'Gujarati Medium',
  type: 'Residential School & Hostel for Boys',
  location:
    'Gandhinagar–Mahudi Road, Piplaj (Near Nava Piplaj), Ta. & Dist. Gandhinagar, Gujarat — 382850',
  seoTitle: 'Maharshi Atri Tapovan (MAT) | Residential School for Boys, Gandhinagar',
  metaDescription:
    'Maharshi Atri Tapovan, Piplaj (Gandhinagar) — a Gujarati-medium GSEB residential school for boys (Std 4–10) blending modern education with yoga, sports, culture and moral values. 100% SSC results for the last 3 years.',
  copyright: '© 2026 Maharshi Atri Tapovan, Piplaj. All rights reserved.',
}
export type NavItem = { label: string; to?: string; href?: string }
export const nav: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Academics', to: '/academics' },
  { label: 'Campus Life', to: '/campus-life' },
  { label: 'Hostel', to: '/hostel' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Admissions', to: '/admissions' },
]
export const hero = {
  headline: 'Where a Boy Becomes a Balanced Man',
  subheadline:
    'Since 2003, Maharshi Atri Tapovan has been nurturing boys — from Std 4 to Std 10 — in a gurukul-inspired residential campus: strong in studies, rooted in sanskar, and skilled for life.',
  primaryCta: { label: 'Admission Enquiry', to: '/admissions' },
  secondaryCta: { label: 'Explore Campus Life', to: '/campus-life' },
}
export const stats = [
  { value: 2003, suffix: '', label: 'Serving since', isYear: true, icon: 'GraduationCap' },
  {
    value: 0,
    suffix: '',
    label: 'Std 4–10 · Boys residential',
    display: '4–10',
    icon: 'BookOpen',
  },
  { value: 100, suffix: '%', label: 'SSC result — last 3 years', icon: 'Award' },
  { value: 3, prefix: 'Top ', suffix: '', label: 'In Gujarat, SSC 2026', icon: 'Medal' },
  { value: 50, suffix: '+', label: 'Activities beyond books', icon: 'Palette' },
]
export const about = {
  intro:
    'Maharshi Atri Tapovan (MAT) is a Gujarati-medium residential school for boys located amidst the calm, green surroundings of Piplaj on the Gandhinagar–Mahudi road. Started in 2003, the campus runs as a modern-day tapovan — a place where classroom learning, physical training, art, spirituality and self-discipline grow together. Every student lives, learns, plays and prays on the same campus, guided by teachers and caretakers around the clock.',
  name: {
    title: 'The Meaning Behind Our Name',
    body: "Maharshi Atri is one of the Saptarishis — the seven great sages of Indian tradition — remembered for his penance, wisdom and humility. A 'Tapovan' was the sacred grove where gurus lived with their students and shaped their character along with their intellect. Our school carries this gurukul spirit into the present: disciplined daily routine, respect for teachers, closeness to nature, and education that builds the whole person — not just the report card.",
  },
  vision:
    'To raise a generation of young men who are academically strong, physically fit, culturally rooted and morally upright — capable of leading themselves, their families and society with confidence and character.',
  mission: [
    'Deliver quality Gujarati-medium education under the Gujarat Board with consistent, excellent results.',
    'Blend the ancient gurukul way of living with smart, digital classrooms and modern teaching tools.',
    'Build health and courage through yoga, pranayam, meditation and 20+ sports and martial arts.',
    'Keep Indian culture alive through drama, music, festivals, oratory and the study of great Indian personalities.',
    'Teach practical life skills, self-management and responsibility, so students can manage their own schedules.',
    'Provide a safe, clean, hygienic and loving hostel that feels like a second home.',
  ],
  message:
    'Marks open doors, but character keeps them open. At Maharshi Atri Tapovan we believe a child needs both — the knowledge to succeed in the modern world and the sanskar to remain grounded within it. Give us your son for these growing years, and we will return to you a disciplined, skilled and self-reliant young man.',
  chairman: {
    name: 'Shri Bharatbhai B. Thummar',
    role: 'Chairman, Maharshi Atri Tapovan',
    photo: TODO, // chairman.jpg
    quote:
      'When we began this journey in 2003, our dream was simple — to create a place where a boy is not merely taught, but shaped. Over the years, our students have brought home 100% board results, state and national honours in sports and culture, and above all, the blessings of thousands of parents. I invite every parent to visit our campus, watch our students’ daily life, and experience the difference a tapovan makes.',
  },
}
export const academics = {
  intro:
    'MAT follows the Gujarat Board (GSEB) curriculum in Gujarati medium — from Std 4 through Std 10. Small class strength, supervised evening study in the hostel, and weekly testing ensure that every boy — not just the topper — performs to his best.',
  facts: [
    { label: 'Board', value: 'GSEB (Gujarat Board)' },
    { label: 'Medium', value: 'Gujarati' },
    { label: 'Classes', value: 'Std 4 to Std 10' },
    { label: 'Study model', value: 'Fully residential with supervised study hours' },
    { label: 'Assessment', value: 'Weekly tests across subjects, plus regular term examinations' },
  ],
  weeklyTest: {
    title: 'Weekly Test System',
    body: "Every student appears for weekly tests, so learning gaps are caught and corrected early — well before board examinations. This continuous testing culture is a key reason behind the school's 100% SSC results for the last 3 years.",
  },
  results: [
    '100% result in SSC (Std 10) Board examinations for the last 3 consecutive years.',
    'Our students ranked among the top 3 in Gujarat in the SSC 2026 examinations.',
  ],
  facilities: [
    {
      icon: 'MonitorSmartphone',
      title: 'Smart Digital Classrooms',
      body: 'Audio-enabled smart classes under CCTV, making lessons visual, interactive and safe.',
    },
    {
      icon: 'Volleyball',
      title: 'Playground',
      body: 'A spacious school playground where boys play and train every day, alongside dedicated grounds and courts for major sports.',
    },
    {
      icon: 'Sparkles',
      title: 'Prayer Hall',
      body: 'A spacious hall where the whole tapovan gathers for morning prayer and Shrimad Bhagavad Gita chanting.',
    },
    {
      icon: 'BookOpen',
      title: 'Library',
      body: 'A quiet reading space with textbooks, reference books and a special collection on great Indian historical characters.',
    },
    {
      icon: 'Laptop',
      title: 'Computer Lab',
      body: 'Hands-on computer education to make every student digitally confident.',
    },
    {
      icon: 'FlaskConical',
      title: 'Science Lab',
      body: 'Practical experiments that turn textbook science into real understanding.',
    },
    {
      icon: 'Hammer',
      title: 'Skill Development Classes',
      body: 'Practical, hands-on sessions where students apply what they learn — from craft and gruh udyog to future-ready skills.',
    },
    {
      icon: 'Trees',
      title: 'Natural Environment',
      body: 'The campus sits in a natural, eco-friendly green zone — silent, clean and free from city distractions — an atmosphere made for focused study.',
    },
  ],
}
export const campusLife = {
  intro:
    "With more than 50 activities woven into daily life, a MAT boy's day is never only about textbooks. Body, mind, art and spirit are trained together.",
  groups: [
    {
      key: 'spirituality',
      icon: 'Sparkles',
      title: 'Spirituality & Discipline',
      items: [
        'Morning prayer with Shrimad Bhagavad Gita chanting',
        'Yoga',
        'Pranayam',
        'Suryanamaskar',
        'Meditation',
        'Celebration of Indian festivals — with their meaning and stories explained',
      ],
    },
    {
      key: 'sports',
      icon: 'Trophy',
      title: 'Sports & Physical Training',
      items: [
        'Volleyball',
        'Kabaddi',
        'Kho-Kho',
        'Basketball',
        'Badminton',
        'Table Tennis',
        'Chess',
        'Carrom',
        'Taekwondo',
        'Judo',
        'Boxing',
        'Wrestling',
        'Skating',
        'Rifle Shooting',
        'Archery',
        'Nunchaku',
        'Lathidav',
        'Pyramid Formation',
        'Burning Ring Jump',
        'Acrobatic Exercise',
      ],
      note: 'A spacious playground plus dedicated indoor and outdoor grounds/courts for major sports.',
    },
    {
      key: 'culture',
      icon: 'Drama',
      title: 'Culture, Arts & Expression',
      items: [
        'Historical and cultural drama — including the longest historical dramatic play staged at our Annual Function',
        'Oratory (public speaking) competitions',
        'Reading and writing on great Indian historical characters',
        'Handmade art, craft and drawing',
        'Music and singing classes',
      ],
    },
    {
      key: 'lifeskills',
      icon: 'HeartHandshake',
      title: 'Life Skills & Personal Growth',
      items: [
        "Gruh udhyog (home-industry) training — learning to create with one's own hands",
        'Child counselling with future-advantage skill training',
        'Student-managed daily schedule — boys learn to run their own routine responsibly',
        "Parenting seminars — guiding parents as partners in the child's growth",
      ],
    },
  ],
}
export const hostel = {
  intro:
    'Every MAT student is a boarder, so hostel life is not an add-on — it is the heart of the tapovan. Safety, hygiene and warmth come first.',
  facilities: [
    {
      icon: 'Wind',
      title: 'Airy, Ventilated Rooms',
      body: 'Extra-ventilated rooms with two windows each, keeping the rooms bright and fresh.',
    },
    {
      icon: 'BedDouble',
      title: 'Personal Bed & Locker',
      body: 'Every boy gets his own separate bed and personal locker.',
    },
    {
      icon: 'Utensils',
      title: 'Tasty, Organic & Hygienic Food',
      body: 'Nutritious meals prepared with organic ingredients under strict hygiene, planned for growing children.',
    },
    {
      icon: 'Droplets',
      title: 'Clean Water Supply',
      body: 'A clean and hygienic drinking-water system across the campus.',
    },
    {
      icon: 'ShowerHead',
      title: 'Washing & Fresh-up Areas',
      body: 'Dedicated washing and fresh-up zones maintained daily.',
    },
    {
      icon: 'Cctv',
      title: 'Full CCTV Coverage',
      body: 'The entire campus — classrooms to corridors — is under CCTV for round-the-clock safety.',
    },
    {
      icon: 'SprayCan',
      title: 'Daily Cleaning & Sanitation',
      body: 'All campus areas are cleaned and sanitised every single day.',
    },
    {
      icon: 'Trees',
      title: 'Peaceful Natural Campus',
      body: 'A silent, green, pollution-free atmosphere that helps boys sleep well, study well and grow well.',
    },
  ],
  timetableNote:
    'Breakfast and school timings below are confirmed by the school; remaining rows are a sample and pending verification.',
  timetable: [
    { time: '05:15', activity: 'Wake up & freshen up', confirmed: false },
    {
      time: '05:45',
      activity: 'Prayer, Gita chanting, yoga, pranayam & suryanamaskar',
      confirmed: false,
    },
    { time: '06:30', activity: 'Breakfast', confirmed: true },
    { time: '07:15', activity: 'School hours begin (with short breaks)', confirmed: true },
    { time: '13:00', activity: 'Lunch & rest', confirmed: false },
    { time: '15:00', activity: 'Afternoon classes / skill sessions', confirmed: false },
    { time: '17:00', activity: 'Sports, martial arts & games', confirmed: false },
    { time: '19:00', activity: 'Evening prayer & dinner', confirmed: false },
    { time: '20:00', activity: 'Supervised self-study', confirmed: false },
    { time: '21:30', activity: 'Lights out', confirmed: false },
  ],
}
export const achievements = [
  {
    icon: 'Award',
    title: 'Best School for Cultural Values & Moral Education in Gujarat',
    body: 'Recognised by the Government of Gujarat for excellence in cultural values and moral education.',
    pending: 'Exact award title, year and awarding department to be confirmed.',
  },
  {
    icon: 'GraduationCap',
    title: '100% SSC Board Results — 3 Years Running',
    body: "Every student cleared the GSEB SSC examination for three consecutive years, with our boys ranking in Gujarat's top 3 in 2026.",
  },
  {
    icon: 'Medal',
    title: 'National & International Sports Players',
    body: 'MAT students have represented and won at national and international level in sports.',
    pending: 'Player names, sports and event details to be added.',
  },
  {
    icon: 'Drama',
    title: 'Champions of Culture & Historical Drama',
    body: 'Our students shine in cultural and historical drama, including staging the longest historical dramatic play at the MAT Annual Function.',
  },
]
export const galleryCategories = [
  { key: 'annual', label: 'Annual Function', icon: 'PartyPopper' },
  { key: 'sports', label: 'Sports & Grounds', icon: 'Trophy' },
  { key: 'festivals', label: 'Festival Celebrations', icon: 'Sparkles' },
  { key: 'yoga', label: 'Yoga, Prayer & Meditation', icon: 'Flower2' },
  { key: 'arts', label: 'Art, Craft & Music', icon: 'Palette' },
  { key: 'campus', label: 'Campus & Hostel', icon: 'Building2' },
]
/** Placeholder gallery tiles — 3 per category until real photos arrive. */
export const galleryItems = galleryCategories.flatMap((c) =>
  [1, 2, 3].map((n) => ({ id: `${c.key}-${n}`, category: c.key, label: c.label, icon: c.icon })),
)
export const testimonials = {
  note: 'Sample testimonials drafted for layout — to be replaced with real quotes and names (with permission).',
  items: [
    {
      quote:
        'MAT is the rare place where my son gets modern education and our own Indian sanskar together. The change in his discipline and confidence is visible at home.',
      author: 'Parent of a Std 8 student',
      role: 'Parent',
    },
    {
      quote:
        'The campus is huge, clean and peaceful — and beyond studies there are so many activities that every boy finds something he loves.',
      author: 'Parent of a Std 6 student',
      role: 'Parent',
    },
    {
      quote:
        'Tapovan taught me how to manage my own day, speak on stage, and stay calm in any situation. It feels like home.',
      author: 'Alumnus, SSC batch',
      role: 'Former student',
    },
  ],
}
export const admissions = {
  intro:
    'Admissions are open for boys seeking a residential education from Std 4 to Std 10 (Gujarati medium, GSEB). Seats are limited, and we encourage parents to visit the campus with their child before finalising.',
  eligibility: [
    'Boys only — fully residential (hostel is compulsory for all students).',
    'Admission offered from Std 4 to Std 10.',
    'Gujarati-medium; prior schooling in Gujarati medium is preferred.',
    'Age appropriate to the standard applied for, as per Gujarat Board norms.',
  ],
  process: [
    {
      step: 1,
      title: 'Enquiry',
      body: 'Fill the enquiry form on this page or call the school office.',
    },
    {
      step: 2,
      title: 'Campus Visit',
      body: 'Visit the tapovan with your son — see the classrooms, hostel, dining and grounds.',
    },
    {
      step: 3,
      title: 'Interaction / Assessment',
      body: 'A simple interaction (and basic assessment where needed) with the student and parents.',
    },
    {
      step: 4,
      title: 'Confirmation',
      body: 'Submit documents and fees to confirm the admission.',
    },
  ],
  documents: [
    'School Leaving Certificate (LC) from previous school',
    "Previous year's mark sheet / report card",
    'Birth certificate',
    'Aadhaar card of student and parents',
    'Passport-size photographs',
    'Caste certificate (if applicable)',
  ],
  standards: [
    'Std 4',
    'Std 5',
    'Std 6',
    'Std 7',
    'Std 8',
    'Std 9',
    'Std 10',
  ],
  successMessage: 'Thank you! Our office will call you within 1–2 working days.',
}
export const contact = {
  address:
    'Maharshi Atri Tapovan, Gandhinagar–Mahudi Road, Piplaj (Near Nava Piplaj), Ta. & Dist. Gandhinagar, Gujarat — 382850',
  officeHours: '8:00 AM – 12:00 PM',
  schoolOffice: '+91 82009 87958',
  admissionsPhone: '+91 82009 87958',
  email: 'atri_tapovan@yahoo.com',
  whatsapp: '+91 81603 89136',
  whatsappMessage:
    'I would like to know more about admissions at Maharshi Atri Tapovan for my child. Please share the admission process and other details. Thank you.',
  whatsappLink:
    'https://wa.me/918160389136?text=' +
    encodeURIComponent(
      'I would like to know more about admissions at Maharshi Atri Tapovan for my child. Please share the admission process and other details. Thank you.',
    ),
  // Google Maps embed — satellite (t=k) view, coordinate query = clean pin, no place card
  mapEmbed:
    'https://maps.google.com/maps?q=23.3152841,72.6818344&t=k&z=17&output=embed',
  socials: {
    facebook:
      'https://www.facebook.com/p/Maharshi-ATRI-Tapovan-MAT-100054428802157/',
    instagram: 'https://www.instagram.com/maharshi_atri_tapovan',
    youtube: 'https://youtube.com/@maharshiatritapovan.gandhinaga',
  },
}
export const footer = {
  about:
    'Maharshi Atri Tapovan, Piplaj — a residential gurukul-style school for boys (Std 4–10) blending Gujarat Board education with sports, culture, yoga and moral values since 2003.',
  quickLinks: [
    { label: 'About', to: '/about' },
    { label: 'Academics', to: '/academics' },
    { label: 'Hostel', to: '/hostel' },
    { label: 'Admissions', to: '/admissions' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Contact', href: 'tel:+918200987958' },
  ] as NavItem[],
}

/** Canonical production origin — no trailing slash. Used for canonical tags, OG URLs and the sitemap. */
export const SITE_URL = 'https://atritapovan.com'

/**
 * Per-route SEO metadata. `path` matches react-router pathname exactly.
 * Applied at runtime by the SEO effect in App.tsx so each page gets a unique
 * <title>, description and canonical URL for search engines and social shares.
 */
export type RouteSeo = { path: string; title: string; description: string }

export const seoRoutes: RouteSeo[] = [
  {
    path: '/',
    title: site.seoTitle,
    description: site.metaDescription,
  },
  {
    path: '/about',
    title: `About the School | ${site.name}`,
    description:
      'Discover Maharshi Atri Tapovan — a gurukul-inspired residential school for boys in Piplaj, Gandhinagar, blending GSEB academics with yoga, sports, culture and self-discipline since 2003.',
  },
  {
    path: '/academics',
    title: `Academics — GSEB Curriculum (Std 4–10) | ${site.name}`,
    description:
      'Gujarati-medium GSEB academics from the Primary Section to Std 10 at Maharshi Atri Tapovan, with 100% SSC results for the last three years and a values-driven learning approach.',
  },
  {
    path: '/campus-life',
    title: `Campus Life — Yoga, Sports & Culture | ${site.name}`,
    description:
      'A day in the life at Maharshi Atri Tapovan: yoga, sports, cultural activities, spiritual practice and disciplined routines on a green residential campus near Gandhinagar.',
  },
  {
    path: '/hostel',
    title: `Hostel & Boarding for Boys | ${site.name}`,
    description:
      'Safe, secure and affordable hostel and boarding facilities for boys at Maharshi Atri Tapovan, Piplaj — nutritious meals, caring wardens and a structured daily routine.',
  },
  {
    path: '/achievements',
    title: `Achievements & Results | ${site.name}`,
    description:
      'Academic results, sports honours and cultural achievements of Maharshi Atri Tapovan students — including 100% SSC results for the last three years.',
  },
  {
    path: '/gallery',
    title: `Photo Gallery | ${site.name}`,
    description:
      'Explore photos of the campus, classrooms, prayer hall, hostel, sports and events at Maharshi Atri Tapovan, Piplaj (Gandhinagar).',
  },
  {
    path: '/admissions',
    title: `Admissions 2026–27 | ${site.name}`,
    description:
      'Admissions are open for the 2026–27 session at Maharshi Atri Tapovan. Learn the process, eligibility and fees, and submit an admission enquiry for your child.',
  },
  {
    path: '/contact',
    title: `Contact & Location | ${site.name}`,
    description:
      'Contact Maharshi Atri Tapovan, Piplaj (Near Nava Piplaj), Gandhinagar–Mahudi Road. Call the school office, send an enquiry or plan a campus visit.',
  },
]