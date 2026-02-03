import React from 'react';
import Button from './Button';
import { useAuth } from '../../contexts/AuthProvider';
import { useToastContext } from '../../contexts/ToastProvider';
import { useAppTranslation } from '../../contexts/I18nProvider';
import { Phone } from 'lucide-react';

interface CallFarmerButtonProps {
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const CallFarmerButton: React.FC<CallFarmerButtonProps> = ({
  farmerId,
  farmerName,
  farmerPhone,
  className = '',
  variant = 'outline',
  size = 'md'
}) => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToastContext();
  const { t } = useAppTranslation('products');

  // Don't show button if user is not a buyer or is the farmer themselves
  if (!user || user.role !== 'BUYER' || String(user._id) === String(farmerId)) {
    return null;
  }

  const handleCallFarmer = () => {
    if (!farmerPhone) {
      showError((t('farmer.noPhoneAvailable') as string) || 'Phone number not available for this farmer');
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanPhone = farmerPhone.replace(/[\s\-\(\)]/g, '');
    
    // Create tel: URL for direct calling
    const telUrl = `tel:${cleanPhone}`;
    
    try {
      // Open the phone dialer
      window.location.href = telUrl;
      showSuccess((t('farmer.callingFarmer', { name: farmerName }) as string) || `Calling ${farmerName}...`);
    } catch (error) {
      showError((t('farmer.callFailed') as string) || 'Unable to initiate call. Please try again.');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCallFarmer}
      className={className}
      disabled={!farmerPhone}
    >
      <span className="inline-flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {(t('farmer.callButton') as string) || 'Call Farmer'}
      </span>
    </Button>
  );
};