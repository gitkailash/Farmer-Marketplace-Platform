import mongoose from 'mongoose';
import { TranslationKey } from '../models/TranslationKey';
import { config } from '../config/environment';

const notificationTranslations = [
  // Order notifications
  {
    key: 'notifications.order.created.title',
    namespace: 'notifications',
    translations: {
      en: 'New Order Received',
      ne: 'नयाँ अर्डर प्राप्त भयो'
    },
    context: 'Title for new order notification',
    isRequired: true
  },
  {
    key: 'notifications.order.created.message',
    namespace: 'notifications',
    translations: {
      en: 'You have received a new order #{{orderNumber}} from {{farmerName}}',
      ne: '{{farmerName}} बाट नयाँ अर्डर #{{orderNumber}} प्राप्त भयो'
    },
    context: 'Message for new order notification',
    isRequired: true
  },
  {
    key: 'notifications.order.accepted.title',
    namespace: 'notifications',
    translations: {
      en: 'Order Accepted',
      ne: 'अर्डर स्वीकार गरियो'
    },
    context: 'Title for order accepted notification',
    isRequired: true
  },
  {
    key: 'notifications.order.accepted.message',
    namespace: 'notifications',
    translations: {
      en: 'Your order #{{orderNumber}} has been accepted and is being prepared',
      ne: 'तपाईंको अर्डर #{{orderNumber}} स्वीकार गरियो र तयार गरिँदैछ'
    },
    context: 'Message for order accepted notification',
    isRequired: true
  },
  {
    key: 'notifications.order.completed.title',
    namespace: 'notifications',
    translations: {
      en: 'Order Completed',
      ne: 'अर्डर पूरा भयो'
    },
    context: 'Title for order completed notification',
    isRequired: true
  },
  {
    key: 'notifications.order.completed.message',
    namespace: 'notifications',
    translations: {
      en: 'Your order #{{orderNumber}} has been completed. Please leave a review!',
      ne: 'तपाईंको अर्डर #{{orderNumber}} पूरा भयो। कृपया समीक्षा दिनुहोस्!'
    },
    context: 'Message for order completed notification',
    isRequired: true
  },
  {
    key: 'notifications.order.cancelled.title',
    namespace: 'notifications',
    translations: {
      en: 'Order Cancelled',
      ne: 'अर्डर रद्द गरियो'
    },
    context: 'Title for order cancelled notification',
    isRequired: true
  },
  {
    key: 'notifications.order.cancelled.message',
    namespace: 'notifications',
    translations: {
      en: 'Your order #{{orderNumber}} has been cancelled. Reason: {{reason}}',
      ne: 'तपाईंको अर्डर #{{orderNumber}} रद्द गरियो। कारण: {{reason}}'
    },
    context: 'Message for order cancelled notification',
    isRequired: true
  },

  // Message notifications
  {
    key: 'notifications.message.new.title',
    namespace: 'notifications',
    translations: {
      en: 'New Message',
      ne: 'नयाँ सन्देश'
    },
    context: 'Title for new message notification',
    isRequired: true
  },
  {
    key: 'notifications.message.new.message',
    namespace: 'notifications',
    translations: {
      en: 'New message from {{senderName}}: {{preview}}',
      ne: '{{senderName}} बाट नयाँ सन्देश: {{preview}}'
    },
    context: 'Message for new message notification',
    isRequired: true
  },

  // Review notifications
  {
    key: 'notifications.review.approved.title',
    namespace: 'notifications',
    translations: {
      en: 'Review Approved',
      ne: 'समीक्षा स्वीकृत भयो'
    },
    context: 'Title for review approved notification',
    isRequired: true
  },
  {
    key: 'notifications.review.approved.message',
    namespace: 'notifications',
    translations: {
      en: 'Your review from {{reviewerName}} ({{rating}} stars) has been approved',
      ne: '{{reviewerName}} को समीक्षा ({{rating}} तारा) स्वीकृत भयो'
    },
    context: 'Message for review approved notification',
    isRequired: true
  },

  // Admin notifications
  {
    key: 'notifications.admin.announcement.title',
    namespace: 'notifications',
    translations: {
      en: 'System Announcement',
      ne: 'प्रणाली घोषणा'
    },
    context: 'Title for admin announcement notification',
    isRequired: true
  },
  {
    key: 'notifications.admin.announcement.message',
    namespace: 'notifications',
    translations: {
      en: 'Important announcement: {{subject}}',
      ne: 'महत्वपूर्ण घोषणा: {{subject}}'
    },
    context: 'Message for admin announcement notification',
    isRequired: true
  },

  // Product notifications
  {
    key: 'notifications.product.lowStock.title',
    namespace: 'notifications',
    translations: {
      en: 'Low Stock Alert',
      ne: 'कम स्टक चेतावनी'
    },
    context: 'Title for low stock notification',
    isRequired: true
  },
  {
    key: 'notifications.product.lowStock.message',
    namespace: 'notifications',
    translations: {
      en: 'Your product "{{productName}}" is running low ({{currentStock}} remaining)',
      ne: 'तपाईंको उत्पादन "{{productName}}" कम छ ({{currentStock}} बाँकी)'
    },
    context: 'Message for low stock notification',
    isRequired: true
  },

  // Farmer verification notifications
  {
    key: 'notifications.farmer.verification.title',
    namespace: 'notifications',
    translations: {
      en: 'Verification Update',
      ne: 'प्रमाणीकरण अपडेट'
    },
    context: 'Title for farmer verification notification',
    isRequired: true
  },
  {
    key: 'notifications.farmer.verification.message',
    namespace: 'notifications',
    translations: {
      en: 'Your farmer verification status has been updated to: {{status}}',
      ne: 'तपाईंको किसान प्रमाणीकरण स्थिति अपडेट भयो: {{status}}'
    },
    context: 'Message for farmer verification notification',
    isRequired: true
  },

  // System messages
  {
    key: 'system.welcome',
    namespace: 'common',
    translations: {
      en: 'Welcome to the Farmer Marketplace!',
      ne: 'किसान बजारमा स्वागत छ!'
    },
    context: 'Welcome message for new users',
    isRequired: true
  },
  {
    key: 'system.maintenance',
    namespace: 'common',
    translations: {
      en: 'System maintenance in progress. Please try again later.',
      ne: 'प्रणाली मर्मत चलिरहेको छ। कृपया पछि प्रयास गर्नुहोस्।'
    },
    context: 'System maintenance message',
    isRequired: true
  },
  {
    key: 'system.error.general',
    namespace: 'common',
    translations: {
      en: 'An error occurred. Please try again.',
      ne: 'त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।'
    },
    context: 'General error message',
    isRequired: true
  }
];

async function seedNotificationTranslations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing notification translations
    await TranslationKey.deleteMany({ namespace: 'notifications' });
    console.log('Cleared existing notification translations');

    // Insert new translations
    for (const translation of notificationTranslations) {
      const existingKey = await TranslationKey.findOne({ key: translation.key });
      
      if (existingKey) {
        // Update existing translation
        existingKey.translations = translation.translations;
        existingKey.context = translation.context;
        existingKey.isRequired = translation.isRequired;
        existingKey.lastUpdated = new Date();
        await existingKey.save();
        console.log(`Updated translation: ${translation.key}`);
      } else {
        // Create new translation
        const newTranslation = new TranslationKey({
          key: translation.key,
          namespace: translation.namespace,
          translations: translation.translations,
          context: translation.context,
          isRequired: translation.isRequired,
          updatedBy: new mongoose.Types.ObjectId('000000000000000000000000') // System user
        });
        await newTranslation.save();
        console.log(`Created translation: ${translation.key}`);
      }
    }

    console.log('Notification translations seeded successfully');
  } catch (error) {
    console.error('Error seeding notification translations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding script
if (require.main === module) {
  seedNotificationTranslations();
}

export { seedNotificationTranslations };