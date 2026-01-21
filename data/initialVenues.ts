
import { Venue } from '../types';

export const initialVenues: Venue[] = [
    {
        id: 1,
        name: "Green Court Sports Club 綠球場體育會",
        description: "One of the most popular indoor pickleball facilities in Kwun Tong. Features high-quality surfaces and professional lighting suitable for competitive play.",
        mtrStation: "Kwun Tong 觀塘",
        mtrExit: "A1",
        walkingDistance: 3,
        address: "Unit 1205, 12/F, Block A, Yip On Factory Building, 1 Hoi Yuen Road, Kwun Tong",
        ceilingHeight: 4.5,
        startingPrice: 150,
        pricing: {
            type: "text",
            content: "• Peak Hours (Mon-Fri 6pm-10pm): $200/hour\n• Off-Peak: $150/hour\n• Weekend: $180/hour\n• Coaching: $500/hour"
        },
        images: [
            "https://picsum.photos/seed/pickle1/800/600",
            "https://picsum.photos/seed/pickle2/800/600"
        ],
        amenities: ["AC", "Showers", "Rental", "Parking"],
        whatsapp: "+85291234567",
        coordinates: { lat: 22.3129, lng: 114.2256 }
    }
];
