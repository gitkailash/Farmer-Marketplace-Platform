#!/usr/bin/env ts-node

/**
 * Quick Admin User Creation Script
 * 
 * Creates an admin user with predefined credentials for testing.
 * Usage: npx ts-node scripts/quick-admin.ts
 * 
 * Default credentials:
 * Email: admin@gmail.com
 * Password: admin123
 */

import mongoose from 'mongoose';
import { User, UserRole } from '../src/models/User';
import { config } from '../src/config/environment';

async function createQuickAdmin(): Promise<void> {
  try {
    console.log('🚀 Quick Admin Creation Script');
    console.log('==============================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      if (existingAdmin.role !== UserRole.ADMIN) {
        console.log('🔄 Upgrading existing user to admin...');
        existingAdmin.role = UserRole.ADMIN;
        await existingAdmin.save();
        console.log('✅ User upgraded to admin!');
      }
      
      console.log('\n🎉 You can login with:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }

    // Create new admin user
    console.log('🔨 Creating admin user...');
    
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
      profile: {
        name: 'System Administrator',
        phone: '+977-1-234-5678',
        address: 'Kathmandu, Nepal'
      }
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name: ${adminUser.profile.name}`);
    console.log(`   Role: ${adminUser.role}`);
    
    console.log('\n🎉 You can now login to the admin panel!');
    console.log('🌐 Frontend URL: http://localhost:3000');
    console.log('🔗 Admin Login: http://localhost:3000/login');
    
    console.log('\n⚠️  SECURITY NOTE: Change the default password after first login!');

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('💡 Admin user already exists with this email.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createQuickAdmin().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});