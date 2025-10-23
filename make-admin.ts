import 'dotenv/config';
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function makeUserAdmin(email: string) {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.email, email))
      .returning();

    if (updatedUser) {
      console.log(`✅ User ${email} is now an admin`);
      console.log('User details:', {
        id: updatedUser.id,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      });
    } else {
      console.log(`❌ User ${email} not found`);
    }
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx make-admin.ts <email>');
  console.log('Example: npx tsx make-admin.ts user@example.com');
  process.exit(1);
}

makeUserAdmin(email);