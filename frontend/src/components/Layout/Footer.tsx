import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, MessageCircle, Phone, Mail, MapPin, Shield, Award, ShoppingCart, Tractor } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section with Newsletter */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Tractor className="text-3xl text-green-500" />
              <span className="text-2xl font-bold">Farmer Market</span>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Connecting farmers directly with buyers for fresh, quality produce at fair prices.
            </p>
            
            

            {/* Social Media */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-blue-500 transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-pink-500 transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <Youtube size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-blue-600 transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-green-500 transition-colors duration-200"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">500+</div>
                <div className="text-xs text-gray-400">Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">2K+</div>
                <div className="text-xs text-gray-400">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">10K+</div>
                <div className="text-xs text-gray-400">Orders</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/products" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-2">
                    <ShoppingCart className="h-6 w-6" />
                  </span>
                  Explore Products
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-2">🌾</span>
                  Become a Farmer
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-2">👥</span>
                  Join as Buyer
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-sm text-white">+977-1-4567890</div>
                  <div className="text-xs text-gray-400">Mon-Fri 9AM-6PM</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-sm text-white">support@farmermarket.com</div>
                  <div className="text-xs text-gray-400">24/7 Response</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-sm text-white">Kathmandu, Nepal</div>
                  <div className="text-xs text-gray-400">Head Office</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-sm text-white">+977-98-12345678</div>
                  <div className="text-xs text-gray-400">WhatsApp Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* For Business & Support */}
          <div>
          {/* Support & Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support & Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/help" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    <span className="mr-2">❓</span>
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    <span className="mr-2">📞</span>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    <span className="mr-2">🔒</span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    <span className="mr-2">📋</span>
                    Terms of Service
                  </Link>
                </li>
                
              </ul>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright and Links */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-gray-400 text-sm">
                © {currentYear} <span className="font-semibold text-white">Farmer Market</span>. All rights reserved.
              </p>
              
            </div>
            
            {/* Language Selector and Trust Badges */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6">
              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Language:</span>
                <select className="bg-gray-700 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="en">English</option>
                  <option value="ne">नेपाली</option>
                </select>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-400">Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-400">Verified</span>
                </div>
              </div>

              {/* Powered By */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">Powered by</span>
                <span className="text-green-500 font-semibold text-xs">Nepal Agriculture</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
