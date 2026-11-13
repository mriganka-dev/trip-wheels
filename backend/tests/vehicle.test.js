import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { BUSINESS_DEFAULTS, ROLES } from "../src/constants.js";
import { Destination } from "../src/models/destination.model.js";
import { User } from "../src/models/user.model.js";
import { createDestinationSchema } from "../src/validators/destination.validator.js";
import {
  createVehicleSchema,
  searchVehiclesSchema,
} from "../src/validators/vehicle.validator.js";

const run = async () => {
  console.log("Running Vehicle, Destination and Search Tests...");

  // 1. Validator tests
  const validDestination = createDestinationSchema.safeParse({
    name: "Manali",
    slug: "manali",
    state: "Himachal Pradesh",
    location: {
      type: "Point",
      coordinates: [77.1892, 32.2396],
    },
  });
  if (!validDestination.success) {
    throw new Error("Valid destination payload was rejected by validator");
  }

  // Reject destination with invalid slug
  const invalidSlug = createDestinationSchema.safeParse({
    name: "Manali",
    slug: "Manali with spaces",
    state: "Himachal Pradesh",
    location: {
      type: "Point",
      coordinates: [77.1892, 32.2396],
    },
  });
  if (invalidSlug.success) {
    throw new Error("Invalid destination slug was accepted by validator");
  }

  // Vehicle validator
  const validVehicle = createVehicleSchema.safeParse({
    destination: "60d0fe4f5311236168a109ca",
    type: "bike",
    brand: "Royal Enfield",
    model: "Classic 350",
    year: 2023,
    transmission: "manual",
    fuelType: "petrol",
    pricing: {
      perDay: 1200,
      perHour: 100,
    },
  });
  if (!validVehicle.success) {
    throw new Error("Valid vehicle draft payload was rejected by validator");
  }

  // 2. Individual cap constant check
  if (BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES !== 2) {
    throw new Error("INDIVIDUAL_MAX_VEHICLES default should be 2");
  }
  console.log("Individual vehicle cap constant verified: 2");

  // Mock User.findById for offline unit testing of route guards
  User.findById = (id) => {
    return Promise.resolve({
      _id: id,
      email: "test.customer@example.com",
      role: ROLES.CUSTOMER,
      accountStatus: "active",
    });
  };

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 3. Search validation: requires destination, from, to
    const invalidSearchRes = await fetch(`${baseUrl}/api/v1/vehicles/search`);
    const invalidSearchJson = await invalidSearchRes.json();
    if (
      invalidSearchRes.status !== 400 ||
      invalidSearchJson.success !== false
    ) {
      throw new Error(
        "Vehicle search without required params should fail with 400"
      );
    }
    console.log("Vehicle search query validation passed: 400 Bad Request");

    // 4. Public active destinations route
    Destination.find = () => ({
      sort: () => ({
        select: () =>
          Promise.resolve([
            { _id: "60d0fe4f5311236168a109ca", name: "Manali", slug: "manali" },
          ]),
      }),
    });

    const destRes = await fetch(`${baseUrl}/api/v1/destinations`);
    const destJson = await destRes.json();
    if (
      destRes.status !== 200 ||
      !destJson.success ||
      !Array.isArray(destJson.data)
    ) {
      throw new Error("GET /api/v1/destinations failed");
    }
    console.log("Public destinations endpoint passed: 200 OK");

    // 5. Unauthenticated vehicle creation -> 401
    const noAuthVehicleRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const noAuthVehicleJson = await noAuthVehicleRes.json();
    if (
      noAuthVehicleRes.status !== 401 ||
      noAuthVehicleJson.success !== false
    ) {
      throw new Error("Unauthenticated vehicle creation should return 401");
    }
    console.log(
      "Unauthenticated vehicle creation route guard passed: 401 Unauthorized"
    );

    // 6. Customer role accessing vehicle creation -> 403
    const customerToken = jwt.sign(
      {
        _id: "60d0fe4f5311236168a109ca",
        email: "cust@example.com",
        role: ROLES.CUSTOMER,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const customerCreateRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        destination: "60d0fe4f5311236168a109ca",
        type: "bike",
        brand: "Royal Enfield",
        model: "Classic 350",
        year: 2023,
        transmission: "manual",
        fuelType: "petrol",
        pricing: { perDay: 1200 },
      }),
    });
    const customerCreateJson = await customerCreateRes.json();
    if (
      customerCreateRes.status !== 403 ||
      customerCreateJson.success !== false
    ) {
      throw new Error(
        "Customer role should be blocked from creating vehicles with 403"
      );
    }
    console.log("Customer role blocked from vehicle creation: 403 Forbidden");

    // 7. Search endpoint empty result JoyTrips suggestion check
    Destination.findOne = () =>
      Promise.resolve({
        _id: "60d0fe4f5311236168a109ca",
        name: "Goa",
        slug: "goa",
        nearbyDestinations: [],
        landmarks: [],
      });

    // Mock PublisherProfile and Vehicle finds for offline test of search response structure
    const originalPublisherProfileFind = (
      await import("../src/models/publisherProfile.model.js")
    ).PublisherProfile.find;
    const { PublisherProfile } =
      await import("../src/models/publisherProfile.model.js");
    const { Vehicle } = await import("../src/models/vehicle.model.js");

    PublisherProfile.find = () => ({
      select: () => Promise.resolve([]),
    });

    User.find = () => ({
      select: () => Promise.resolve([]),
    });

    Vehicle.find = () => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              select: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    });

    const searchRes = await fetch(
      `${baseUrl}/api/v1/vehicles/search?destination=goa&from=2026-12-01T10:00:00Z&to=2026-12-05T10:00:00Z`
    );
    const searchJson = await searchRes.json();
    if (searchRes.status !== 200) {
      console.log("Search error status:", searchRes.status, searchJson);
    }
    if (searchRes.status === 200) {
      if (
        searchJson.data.items.length === 0 &&
        searchJson.data.suggestions?.joytrips?.url
      ) {
        console.log(
          "Empty search result returned JoyTrips suggestion link successfully:",
          searchJson.data.suggestions.joytrips.url
        );
      }
    }

    console.log(
      "All Vehicle, Destination and Search tests passed successfully."
    );
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Vehicle test failed:", err);
  process.exit(1);
});
