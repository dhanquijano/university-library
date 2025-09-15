export const navigationLinks = [
  {
    href: "/library",
    label: "Library",
  },

  {
    img: "/icons/user.svg",
    selectedImg: "/icons/user-fill.svg",
    href: "/my-profile",
    label: "My Profile",
  },
];

export const adminSideBarLinks = [
  {
    img: "/icons/admin/user.svg",
    route: "/",
    text: "Return to Main",
  },
  {
    img: "/icons/admin/home.svg",
    route: "/admin",
    text: "Home",
  },

  {
    img: "/icons/admin/book.svg",
    route: "/admin/appointments",
    text: "All Appointments",
  },
  {
    img: "/icons/admin/bookmark.svg",
    route: "/admin/inventory",
    text: "Inventory Management",
  },
  {
    img: "/icons/admin/receipt.svg",
    route: "/admin/sales",
    text: "Sales Management",
  },
  {
    img: "/icons/admin/calendar.svg",
    route: "/admin/scheduling",
    text: "Staff Scheduling",
  },
];

export const FIELD_NAMES = {
  fullName: "Full name",
  email: "Email",
  password: "Password",
};

export const FIELD_TYPES = {
  fullName: "text",
  email: "email",
  password: "password",
};

export const sampleBooks = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fantasy / Fiction",
    rating: 4.6,
    totalCopies: 20,
    availableCopies: 10,
    description:
      "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
    coverColor: "#1c1f40",
    coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death. A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help / Productivity",
    rating: 4.9,
    totalCopies: 99,
    availableCopies: 50,
    description:
      "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
    coverColor: "#fffdf6",
    coverUrl: "https://m.media-amazon.com/images/I/81F90H7hnML.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
  },
  {
    id: 3,
    title: "You Don't Know JS: Scope & Closures",
    author: "Kyle Simpson",
    genre: "Computer Science / JavaScript",
    rating: 4.7,
    totalCopies: 9,
    availableCopies: 5,
    description:
      "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
    coverColor: "#f8e036",
    coverUrl:
      "https://m.media-amazon.com/images/I/7186YfjgHHL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
  },
  {
    id: 4,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Philosophy / Adventure",
    rating: 4.5,
    totalCopies: 78,
    availableCopies: 50,
    description:
      "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
    coverColor: "#ed6322",
    coverUrl:
      "https://m.media-amazon.com/images/I/61HAE8zahLL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
  },
  {
    id: 5,
    title: "Deep Work",
    author: "Cal Newport",
    genre: "Self-Help / Productivity",
    rating: 4.7,
    totalCopies: 23,
    availableCopies: 23,
    description:
      "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
    coverColor: "#ffffff",
    coverUrl: "https://m.media-amazon.com/images/I/81JJ7fyyKyS.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
  },
  {
    id: 6,
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Computer Science / Programming",
    rating: 4.8,
    totalCopies: 56,
    availableCopies: 56,
    description:
      "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
    coverColor: "#080c0d",
    coverUrl:
      "https://m.media-amazon.com/images/I/71T7aD3EOTL._UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
  },
  {
    id: 7,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    genre: "Computer Science / Programming",
    rating: 4.8,
    totalCopies: 25,
    availableCopies: 3,
    description:
      "A timeless guide for developers to hone their skills and improve their programming practices.",
    coverColor: "#100f15",
    coverUrl:
      "https://m.media-amazon.com/images/I/71VStSjZmpL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A timeless guide for developers to hone their skills and improve their programming practices.",
  },
  {
    id: 8,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Finance / Self-Help",
    rating: 4.8,
    totalCopies: 10,
    availableCopies: 5,
    description:
      "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
    coverColor: "#ffffff",
    coverUrl:
      "https://m.media-amazon.com/images/I/81Dky+tD+pL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
  },
];

export const sorts = [
  {
    value: "oldest",
    label: "Oldest",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "highestRated",
    label: "Highest Rated",
  },
];

export const userRoles = [
  {
    value: "USER",
    label: "User",
    bgColor: "bg-[#FDF2FA]",
    textColor: "text-[#C11574]",
  },
  {
    value: "ADMIN",
    label: "Admin",
    bgColor: "bg-[#ECFDF3]",
    textColor: "text-[#027A48]",
  },
  {
    value: "MANAGER",
    label: "Manager",
    bgColor: "bg-[#EFF6FF]",
    textColor: "text-[#1D4ED8]",
  },
  {
    value: "STAFF",
    label: "Staff",
    bgColor: "bg-[#FEF3C7]",
    textColor: "text-[#D97706]",
  },
];

export const borrowStatuses = [
  {
    value: "overdue",
    label: "Overdue",
    bgColor: "bg-[#FFF1F3]",
    textColor: "text-[#C01048]",
  },
  {
    value: "borrowed",
    label: "Borrowed",
    bgColor: "bg-[#F9F5FF]",
    textColor: "text-[#6941C6]",
  },
  {
    value: "returned",
    label: "Returned",
    bgColor: "bg-[#F0F9FF]",
    textColor: "text-[#026AA2]",
  },
];

export const APPOINTMENT_FIELD_NAMES = {
  email: "Email",
  fullName: "Full Name",
  mobileNumber: "Mobile Number",
  appointmentDate: "Appointment Date",
  appointmentTime: "Appointment Time",
  branch: "Branch",
  barber: "Barber",
  services: "Services",
};

export const APPOINTMENT_FIELD_TYPES = {
  email: "email",
  fullName: "text",
  mobileNumber: "tel",
  appointmentDate: "date",
  appointmentTime: "time",
  branch: "text",
  barber: "text",
  services: "text",
};
