import "dotenv/config"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"

async function seedAdmin() {
  await connectToDatabase()

  const existing = await User.findOne({ username: "admin" })
  if (existing) {
    console.log("Admin user already exists")
    return
  }

  const adminUser = new User({
    username: "admin",
    email: "admin@example.com",
    password: "password", // You can hash this if needed
    isAdmin: true,
  })

  await adminUser.save()
  console.log("✅ Admin user created")
}

seedAdmin().then(() => process.exit())


