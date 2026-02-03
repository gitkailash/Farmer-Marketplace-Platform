/**
 * TypeScript definitions for translation keys
 * Auto-generated from translation files for type safety
 */

// Common namespace types
export interface CommonTranslations {
  buttons: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    submit: string;
    reset: string;
    search: string;
    filter: string;
    clear: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
  };
  navigation: {
    home: string;
    products: string;
    orders: string;
    messages: string;
    profile: string;
    dashboard: string;
    admin: string;
    logout: string;
    login: string;
    register: string;
  };
  labels: {
    name: string;
    email: string;
    phone: string;
    address: string;
    price: string;
    quantity: string;
    total: string;
    date: string;
    time: string;
    status: string;
    category: string;
    description: string;
    image: string;
    language: string;
    optional: string;
  };
  messages: {
    loading: string;
    error: string;
    success: string;
    noData: string;
    confirmDelete: string;
    saved: string;
    deleted: string;
    updated: string;
    created: string;
  };
  languages: {
    en: string;
    ne: string;
    english: string;
    nepali: string;
  };
  validation: {
    required: string;
    email: string;
    phone: string;
    minLength: string;
    maxLength: string;
    numeric: string;
    positive: string;
  };
  ui: {
    loading: string;
    retry: string;
    retrying: string;
    close: string;
    signIn: string;
    signUp: string;
    accessDashboard: string;
    dontHaveAccount: string;
    createOne: string;
    showPassword: string;
    hidePassword: string;
    signingIn: string;
    switchTo: string;
    languageChanged: string;
  };
  errors: {
    loginFailed: string;
    networkError: string;
    serverError: string;
    validationError: string;
    unknownError: string;
  };
}

// Auth namespace types
export interface AuthTranslations {
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    rememberMe: string;
    forgotPassword: string;
    submit: string;
    noAccount: string;
    signUp: string;
  };
  register: {
    title: string;
    subtitle: string;
    firstName: string;
    lastName: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    address: string;
    addressPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    userType: string;
    roleLabel: string;
    farmer: string;
    farmerOption: string;
    buyer: string;
    buyerOption: string;
    admin: string;
    district: string;
    selectDistrict: string;
    municipality: string;
    selectMunicipality: string;
    selectDistrictFirst: string;
    municipalityHelp: string;
    submit: string;
    creating: string;
    hasAccount: string;
    signIn: string;
    loginLink: string;
    backToHome: string;
    terms: string;
    languagePreference: string;
    languageHelp: string;
    validation: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordMinLength: string;
      confirmPasswordRequired: string;
      passwordMismatch: string;
      nameRequired: string;
      nameMinLength: string;
      phoneInvalid: string;
      roleRequired: string;
      districtRequired: string;
      municipalityRequired: string;
      registrationFailed: string;
    };
  };
  profile: {
    title: string;
    personalInfo: string;
    preferences: string;
    security: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  };
  messages: {
    loginSuccess: string;
    loginError: string;
    registerSuccess: string;
    registerError: string;
    logoutSuccess: string;
    passwordChanged: string;
    profileUpdated: string;
  };
}

// Products namespace types
export interface ProductsTranslations {
  list: {
    title: string;
    searchPlaceholder: string;
    filterByCategory: string;
    sortBy: string;
    sortOptions: {
      name: string;
      price: string;
      date: string;
      rating: string;
    };
    noProducts: string;
    loadMore: string;
  };
  details: {
    description: string;
    price: string;
    unit: string;
    farmer: string;
    category: string;
    availability: string;
    inStock: string;
    outOfStock: string;
    addToCart: string;
    contactFarmer: string;
    reviews: string;
    writeReview: string;
  };
  form: {
    title: string;
    addProduct: string;
    editProduct: string;
    name: string;
    description: string;
    price: string;
    unit: string;
    category: string;
    images: string;
    availability: string;
    tags: string;
    submit: string;
  };
  categories: {
    vegetables: string;
    fruits: string;
    grains: string;
    dairy: string;
    meat: string;
    herbs: string;
    other: string;
  };
  units: {
    kg: string;
    g: string;
    liter: string;
    piece: string;
    dozen: string;
    bundle: string;
  };
  messages: {
    addedToCart: string;
    productSaved: string;
    productDeleted: string;
    contactSent: string;
  };
  cart: {
    title: string;
    empty: string;
    itemCount: string;
    itemCount_plural: string;
    subtotal: string;
    checkout: string;
    continueShopping: string;
    removeItem: string;
    updateQuantity: string;
  };
  orders: {
    title: string;
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    orderStatus: string;
    orderTotal: string;
    viewDetails: string;
    trackOrder: string;
    cancelOrder: string;
    reorder: string;
    status: {
      pending: string;
      confirmed: string;
      processing: string;
      shipped: string;
      delivered: string;
      cancelled: string;
    };
  };
}

// Admin namespace types
export interface AdminTranslations {
  dashboard: {
    title: string;
    overview: string;
    statistics: string;
    recentActivity: string;
  };
  users: {
    title: string;
    list: string;
    add: string;
    edit: string;
    delete: string;
    search: string;
    filters: {
      all: string;
      farmers: string;
      buyers: string;
      admins: string;
      active: string;
      inactive: string;
    };
    details: {
      personalInfo: string;
      accountInfo: string;
      activity: string;
      role: string;
      status: string;
      joinDate: string;
      lastLogin: string;
    };
  };
  content: {
    title: string;
    news: string;
    mayorMessages: string;
    gallery: string;
    announcements: string;
    add: string;
    edit: string;
    publish: string;
    unpublish: string;
    draft: string;
    published: string;
  };
  translations: {
    title: string;
    completeness: string;
    missingKeys: string;
    export: string;
    import: string;
    validate: string;
    languages: {
      english: string;
      nepali: string;
    };
    namespaces: {
      common: string;
      auth: string;
      products: string;
      admin: string;
    };
  };
  moderation: {
    title: string;
    flagged: string;
    reports: string;
    approve: string;
    reject: string;
    hide: string;
    review: string;
  };
  messages: {
    userCreated: string;
    userUpdated: string;
    userDeleted: string;
    contentPublished: string;
    contentUnpublished: string;
    translationsExported: string;
    translationsImported: string;
  };
  messaging: {
    title: string;
    newMessage: string;
    sendMessage: string;
    messageThread: string;
    recipient: string;
    subject: string;
    messageBody: string;
    send: string;
    reply: string;
    forward: string;
    delete: string;
    markAsRead: string;
    markAsUnread: string;
    noMessages: string;
    messageSent: string;
    messageDeleted: string;
    typing: string;
    online: string;
    offline: string;
    lastSeen: string;
  };
}

// Combined translation resources type
export interface TranslationResources {
  common: CommonTranslations;
  auth: AuthTranslations;
  products: ProductsTranslations;
  admin: AdminTranslations;
}

// Translation key paths for type-safe key access
export type TranslationKey = 
  | `common.${keyof CommonTranslations | `${keyof CommonTranslations}.${string}`}`
  | `auth.${keyof AuthTranslations | `${keyof AuthTranslations}.${string}`}`
  | `products.${keyof ProductsTranslations | `${keyof ProductsTranslations}.${string}`}`
  | `admin.${keyof AdminTranslations | `${keyof AdminTranslations}.${string}`}`;

// Supported languages
export type SupportedLanguage = 'en' | 'ne';

// Namespace types
export type Namespace = 'common' | 'auth' | 'products' | 'admin';

// Translation function type
export type TranslationFunction = (key: TranslationKey, options?: any) => string;