import "dotenv/config";
import postgres from "postgres";
import db from "./config/connect.js";
import { routeTable } from "./drizzle/schema.js";
import { schoolTable } from "./drizzle/schema.js";

const client = postgres(process.env.DATABASE_URL);

async function checkStopsColumn() {
  try {
    const result = await client`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'route' AND column_name = 'stops'`;
    console.log("Route.stops column:", result);
  } catch (error) {
    console.error("Error checking stops column:", error);
  } finally {
    await client.end();
  }
}

async function checkAndFixRoutes() {
  // Find all routes with missing or invalid school_id
  const routes = await db.select().from(routeTable);
  const schools = await db.select().from(schoolTable);
  const validSchoolIds = new Set(schools.map(s => s.id));

  let brokenRoutes = routes.filter(r => !r.schoolId || !validSchoolIds.has(r.schoolId));

  if (brokenRoutes.length === 0) {
    console.log("All routes have valid school_id.");
    return;
  }

  console.log(`Found ${brokenRoutes.length} routes with missing or invalid school_id.`);
  for (const route of brokenRoutes) {
    console.log(`Route ID: ${route.id}, Name: ${route.name}, schoolId: ${route.schoolId}`);
  }

  // Optionally, delete broken routes (uncomment to enable)
  // for (const route of brokenRoutes) {
  //   await db.delete(routeTable).where(routeTable.id.eq(route.id));
  //   console.log(`Deleted route with ID: ${route.id}`);
  // }
}

checkStopsColumn();
checkAndFixRoutes().then(() => process.exit(0)); 