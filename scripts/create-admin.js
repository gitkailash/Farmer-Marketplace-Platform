#!/usr/bin/env node

/**
 * Admin User Creation Script for Farmer Marketplace Platform
 * 
 * This script creates an admin user in the database.
 * Usage: node scripts/create-admin.js
 * 
 * You will be prompted to enter admin details.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '../backend/.env' });

// User role enumeration
const UserRole = {
  VISITOR: 'VISITOR',
  BUYER: 'BUYER',
  FARMER: 'FARMER',
  ADMIN: 'ADMIN'
};

// User schema (simplified for script)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.VISITOR
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Helper function to ask for password (hidden input)
const askPassword = (question) => {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', (char) => {
      char = char.toString();
      
      if (char === '\n' || char === '\r' || char === '\u0004') {
        // Enter pressed
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C pressed
        process.stdout.write('\n');
        process.exit(1);
      } else if (char === '\u007f') {
        // Backspace pressed
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        // Regular character
        password += char;
        process.stdout.write('*');
      }
    });
  });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Main function to create admin user
async function createAdminUser() {
  try {
    console.log('🔧 Admin User Creation Script');
    console.log('============================\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmer-marketplace';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get admin details from user
    let email;
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

    let password;
    let confirmPassword;
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

  } catch (error) {
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