export interface Stylists {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  image: string;
}

export const stylists: Stylists[] = [
    {
        id: "1",
        name: "Mark  Torres",
        expertise: ["Haircut", "Shaving", "Styling"],
        rating: 4.5,
        image: "/images/Barber-styling.jpg"
    },
    {
        id: "2",
        name: "Elena Santos",
        expertise: ["Hair Coloring", "Hair Treatment", "Hot Oil"],
        rating: 4.7,
        image: "/images/Barber-treatment.jpg"
    },
    {
        id: "3",
        name: "Luis Gomez",
        expertise: ["Haircut", "Hair Coloring", "Styling"],
        rating: 4.6,
        image: "/images/Barber-haircut.jpg"
    },
    {
        id: "4",
        name: "Caitlyn Murillo",
        expertise: ["Hair Coloring", "Spa & Wellness", "Styling"],
        rating: 4.8,
        image: "/images/barber-treatment2.jpg"
    },
    {
        id: "5",
        name: "Jian Salazar",
        expertise: ["Shaving", "Hair Treatment", "Styling"],
        rating: 4.9,
        image: "/images/barber-haircut2.jpg"
    },
    {
        id: "6",
        name: "Joseph Deligencia",
        expertise: ["Shaving", "Haircut", "Styling"],
        rating: 4.7,
        image: "/images/barber-styling2.jpg"
    }
]