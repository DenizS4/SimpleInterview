"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function authenticateUser(email: string, password: string, userType: "admin" | "candidate") {
  try {
    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, password_hash, role, created_at
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = users[0]
    const pass = "admin123"
    const hash = await bcrypt.hash(pass, 12) // 12 = salt rounds
    console.log("created Hash for admin123: ", hash)
    console.log("real Hash for admin123: ", user.password_hash)
    // Verify password
    const isValidHash = await bcrypt.compare(password, hash)
    console.log(isValidHash)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" }
    }

    // Check user type authorization
    if (userType === "admin") {
      // Admin login - must be admin, editor, or owner
      if (!["admin", "editor", "owner"].includes(user.role)) {
        return { success: false, error: "Access denied. Admin privileges required." }
      }
    } else {
      // Candidate login - must be candidate or no role specified
      if (user.role && ["admin", "editor", "owner"].includes(user.role)) {
        return { success: false, error: "Please use the admin login for your account." }
      }
    }

    // Return user data (excluding password hash)
    const { password_hash, ...userData } = user
    return {
      success: true,
      user: userData,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function getCurrentUserRole(email: string) {
  try {
    const users = await sql`
      SELECT role FROM users WHERE email = ${email}
    `

    return users.length > 0 ? users[0].role : null
  } catch (error) {
    console.error("Failed to get user role:", error)
    return null
  }
}
