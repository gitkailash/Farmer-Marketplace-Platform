#!/usr/bin/env ts-node

/**
 * Admin User Creation Script for Farmer Marketplace Platform
 * 
 * This TypeScript script creates an admin user in the database.
 * Usage: npx ts-node scripts/create-admin.ts
 * 
 * You will be prompted to enter admin details.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';
import { User, UserRole, IUser } from '../src/models/User';
import { config } from '../src/config/environment';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Helper function to ask for password (simplified approach)
const askPassword = async (question: string): Promise<string> => {
  process.stdout.write(question);
  
  // For simplicity, we'll just use regular input for now
  // In a production script, you'd want to use a proper password input library
  const password = await askQuestion('');
  return password;
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Main function to create admin user
async function createAdminUser(): Promise<void> {
  try {
    console.log('🔧 Admin User Creation Script');
    console.log('============================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details from user
    let email: string;
    do {
      email = await askQuestion('📧 Enter admin email: ');
      if (!isValidEmail(email)) {
        console.log('❌ Please enter a valid email address\n');
      }
    } while (!isValidEmail(email));

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User with this email already exists!');
      if (existingUser.role === UserRole.ADMIN) {
        console.log('ℹ️  This user is already an admin.');
      } else {
        console.log(`ℹ️  This user exists with role: ${existingUser.role}`);
        const upgrade = await askQuestion('🔄 Do you want to upgrade this user to admin? (y/N): ');
        if (upgrade.toLowerCase() === 'y' || upgrade.toLowerCase() === 'yes') {
          existingUser.role = UserRole.ADMIN;
          await existingUser.save();
          console.log('✅ User upgraded to admin successfully!');
          return;
        }
      }
      console.log('❌ Admin creation cancelled.');
      return;
    }

    let password: string = '';
    let confirmPassword: string = '';
    do {
      password = await askPassword('🔒 Enter admin password (min 6 characters): ');
      if (password.length < 6) {
        console.log('❌ Password must be at least 6 characters long\n');
        continue;
      }
      confirmPassword = await askPassword('🔒 Confirm admin password: ');
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match\n');
      }
    } while (password.length < 6 || password !== confirmPassword);

    console.log(''); // Add a blank line for better formatting

    const name = await askQuestion('👤 Enter admin full name: ');
    const phone = await askQuestion('📱 Enter admin phone (optional): ');
    const address = await askQuestion('🏠 Enter admin address (optional): ');

    // Create admin user
    console.log('\n🔨 Creating admin user...');
    
    const adminUser = new User({
      email: email.toLowerCase(),
      password: password,
      role: UserRole.ADMIN,
      profile: {
        name: name,
        phone: phone || undefined,
        address: address || undefined
      }
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.profile.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    
    console.log('\n🎉 You can now login to the admin panel with these credentials!');
    console.log('🌐 Admin Panel URL: http://localhost:3000/admin');

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('💡 This email is already registered. Use a different email.');
    }
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  rl.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(1);
});

// Run the script
createAdminUser().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});