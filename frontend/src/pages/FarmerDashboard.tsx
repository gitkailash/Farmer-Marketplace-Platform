import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { FarmerDashboardLayout } from '../components/UI'
import { withRole } from '../contexts/AuthProvider'
import FarmerProducts from './farmer/FarmerProducts.tsx'
import FarmerOrders from './farmer/FarmerOrders.tsx'
import FarmerReviews from './farmer/FarmerReviews.tsx'
import FarmerMessages from './farmer/FarmerMessages.tsx'
import FarmerOverview from './farmer/FarmerOverview.tsx'

const FarmerDashboard: React.FC = () => {
  return (
    <FarmerDashboardLayout>
      <Routes>
        <Route path="/" element={<FarmerOverview />} />
        <Route path="/products" element={<FarmerProducts />} />
        <Route path="/orders" element={<FarmerOrders />} />
        <Route path="/reviews" element={<FarmerReviews />} />
        <Route path="/messages" element={<FarmerMessages />} />
        <Route path="*" element={<Navigate to="/farmer" replace />} />
      </Routes>
    </FarmerDashboardLayout>
  )
}

export default withRole(FarmerDashboard, ['FARMER'])