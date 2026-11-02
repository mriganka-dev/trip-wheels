import { connectDB, disconnectDB } from "../src/db/index.js";
import { Destination } from "../src/models/destination.model.js";

const destinationsData = [
  {
    name: "Digha",
    slug: "digha",
    state: "West Bengal",
    description:
      "A popular coastal resort town known for its flat hard beaches and scenic sea views.",
    isPilot: true,
    location: {
      type: "Point",
      coordinates: [87.5113, 21.6266],
    },
    landmarks: [
      {
        name: "Old Digha Beach",
        location: {
          type: "Point",
          coordinates: [87.509, 21.623],
        },
      },
      {
        name: "New Digha Sea Beach",
        location: {
          type: "Point",
          coordinates: [87.525, 21.629],
        },
      },
      {
        name: "Marine Aquarium",
        location: {
          type: "Point",
          coordinates: [87.514, 21.627],
        },
      },
    ],
  },
  {
    name: "Darjeeling",
    slug: "darjeeling",
    state: "West Bengal",
    description:
      "The Queen of the Hills, renowned for tea plantations and stunning views of Mount Kanchenjunga.",
    isPilot: true,
    location: {
      type: "Point",
      coordinates: [88.2627, 27.041],
    },
    landmarks: [
      {
        name: "Tiger Hill",
        location: {
          type: "Point",
          coordinates: [88.248, 26.994],
        },
      },
      {
        name: "Batasia Loop",
        location: {
          type: "Point",
          coordinates: [88.249, 27.017],
        },
      },
      {
        name: "Mall Road",
        location: {
          type: "Point",
          coordinates: [88.269, 27.043],
        },
      },
      {
        name: "Japanese Peace Pagoda",
        location: {
          type: "Point",
          coordinates: [88.256, 27.03],
        },
      },
    ],
  },
  {
    name: "Puri",
    slug: "puri",
    state: "Odisha",
    description:
      "A sacred coastal city on the Bay of Bengal, famous for the historic Shree Jagannath Temple.",
    isPilot: true,
    location: {
      type: "Point",
      coordinates: [85.8312, 19.8135],
    },
    landmarks: [
      {
        name: "Jagannath Temple",
        location: {
          type: "Point",
          coordinates: [85.818, 19.805],
        },
      },
      {
        name: "Golden Beach",
        location: {
          type: "Point",
          coordinates: [85.835, 19.8],
        },
      },
      {
        name: "Swargadwar",
        location: {
          type: "Point",
          coordinates: [85.823, 19.794],
        },
      },
    ],
  },
];

export const seedDestinations = async () => {
  await connectDB();

  console.log("Seeding pilot destinations (Digha, Darjeeling, Puri)...");

  const seeded = [];
  for (const item of destinationsData) {
    const doc = await Destination.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seeded.push(doc);
    console.log(`- Upserted destination: ${doc.name} (${doc.slug})`);
  }

  // Cross-link nearby destinations
  const digha = seeded.find((d) => d.slug === "digha");
  const puri = seeded.find((d) => d.slug === "puri");

  if (digha && puri) {
    await Destination.findByIdAndUpdate(digha._id, {
      $addToSet: {
        nearbyDestinations: {
          destination: puri._id,
          distanceKm: 320,
        },
      },
    });

    await Destination.findByIdAndUpdate(puri._id, {
      $addToSet: {
        nearbyDestinations: {
          destination: digha._id,
          distanceKm: 320,
        },
      },
    });
    console.log("Cross-linked nearby pilot destinations.");
  }

  console.log("Destinations seed completed successfully.");
  await disconnectDB();
};

if (process.argv[1]?.endsWith("seedDestinations.js")) {
  seedDestinations().catch(async (err) => {
    console.error("Destinations seeding failed:", err);
    await disconnectDB();
    process.exit(1);
  });
}

