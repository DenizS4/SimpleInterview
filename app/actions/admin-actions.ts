"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function getAdminUsersAction() {
  try {
    const users = await sql`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users 
      WHERE role IN ('admin', 'owner', 'editor')
      ORDER BY created_at DESC
    `

    return { success: true, users }
  } catch (error) {
    console.error("Failed to get admin users:", error)
    return { error: "Failed to load admin users" }
  }
}

export async function createAdminUserAction(
  data: {
    email: string
    first_name: string
    last_name: string
    password: string
    role: string
  },
  currentUserEmail: string,
) {
  try {
    // Check if current user is owner
    const currentUser = await sql`
      SELECT role FROM users WHERE email = ${currentUserEmail}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "owner") {
      return { error: "Access denied. Only owners can create users." }
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${data.email}
    `

    if (existingUser.length > 0) {
      return { error: "User with this email already exists" }
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(data.password, 12)

    // Create new admin user
    const user = await sql`
      INSERT INTO users (email, first_name, last_name, password_hash, role)
      VALUES (${data.email}, ${data.first_name}, ${data.last_name}, ${passwordHash}, ${data.role})
      RETURNING id, email, first_name, last_name, role, created_at
    `

    return { success: true, user: user[0] }
  } catch (error) {
    console.error("Failed to create admin user:", error)
    return { error: "Failed to create admin user" }
  }
}

export async function updateAdminUserAction(
  userId: string,
  data: {
    email: string
    first_name: string
    last_name: string
    password: string
    role: string
  },
  currentUserEmail: string,
) {
  try {
    // Check if current user is owner
    const currentUser = await sql`
      SELECT role FROM users WHERE email = ${currentUserEmail}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "owner") {
      return { error: "Access denied. Only owners can update users." }
    }

    // Check if email is already taken by another user
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${data.email} AND id != ${userId}
    `

    if (existingUser.length > 0) {
      return { error: "Email is already taken by another user" }
    }

    // Update user
    let updateQuery
    if (data.password) {
      // Hash new password with 12 salt rounds
      const passwordHash = await bcrypt.hash(data.password, 12)

      updateQuery = sql`
        UPDATE users 
        SET email = ${data.email}, 
            first_name = ${data.first_name}, 
            last_name = ${data.last_name}, 
            password_hash = ${passwordHash}, 
            role = ${data.role},
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, first_name, last_name, role, created_at
      `
    } else {
      updateQuery = sql`
        UPDATE users 
        SET email = ${data.email}, 
            first_name = ${data.first_name}, 
            last_name = ${data.last_name}, 
            role = ${data.role},
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, first_name, last_name, role, created_at
      `
    }

    const user = await updateQuery

    return { success: true, user: user[0] }
  } catch (error) {
    console.error("Failed to update admin user:", error)
    return { error: "Failed to update admin user" }
  }
}

export async function deleteAdminUserAction(userId: string, currentUserEmail: string) {
  try {
    // Check if current user is owner
    const currentUser = await sql`
      SELECT role FROM users WHERE email = ${currentUserEmail}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "owner") {
      return { error: "Access denied. Only owners can delete users." }
    }

    // Don't allow deleting owner accounts
    const user = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `

    if (user[0]?.role === "owner") {
      return { error: "Cannot delete owner account" }
    }

    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    return { success: true }
  } catch (error) {
    console.error("Failed to delete admin user:", error)
    return { error: "Failed to delete admin user" }
  }
}
