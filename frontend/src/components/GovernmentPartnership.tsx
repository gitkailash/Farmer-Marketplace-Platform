import React from 'react';
import { Shield, Award, CheckCircle, ExternalLink } from 'lucide-react';
import { useAppTranslation } from '../contexts/I18nProvider';

interface GovernmentPartnershipProps {
  className?: string;
}

export const GovernmentPartnership: React.FC<GovernmentPartnershipProps> = ({ 
  className = '' 
}) => {
  const { t } = useAppTranslation('common');

  const certifications = [
    {
      id: 'ministry-agriculture',
      name: t('government.certifications.ministry_agriculture'),
      number: 'MoALD/2024/001',
      icon: Shield,
      verified: true
    },
    {
      id: 'digital-nepal',
      name: t('government.certifications.digital_nepal'),
      number: 'DN/2024/MP/047',
      icon: Award,
      verified: true
    },
    {
      id: 'food-safety',
      name: t('government.certifications.food_safety'),
      number: 'DFTQC/2024/FS/123',
      icon: CheckCircle,
      verified: true
    }
  ];

  const partnerships = [
    {
      id: 'ministry-agriculture',
      name: t('government.partnerships.ministry_agriculture'),
      description: t('government.partnerships.ministry_agriculture_desc'),
      logo: '/images/government/ministry-agriculture-logo.png'
    },
    {
      id: 'digital-nepal',
      name: t('government.partnerships.digital_nepal'),
      description: t('government.partnerships.digital_nepal_desc'),
      logo: '/images/government/digital-nepal-logo.png'
    },
    {
      id: 'local-government',
      name: t('government.partnerships.local_government'),
      description: t('government.partnerships.local_government_desc'),
      logo: '/images/government/local-govt-logo.png'
    }
  ];

  return (
    <section className={`py-12 bg-gradient-to-r from-blue-50 to-green-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              {t('government.title')}
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('government.subtitle')}
          </p>
        </div>

        {/* Government Certifications */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {t('government.certifications.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert) => {
              const IconComponent = cert.icon;
              return (
                <div 
                  key={cert.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-3">
                    <IconComponent className="w-6 h-6 text-green-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {cert.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {t('government.certifications.number')}: {cert.number}
                      </p>
                    </div>
                    {cert.verified && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ✓ {t('government.certifications.verified')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Government Partnerships */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {t('government.partnerships.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partnerships.map((partner) => (
              <div 
                key={partner.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiA4TDIwIDEySDEyTDE2IDhaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik04IDE2TDEyIDIwVjEyTDggMTZaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yNCAxNkwyMCAyMFYxMkwyNCAxNloiIGZpbGw9IiM5QjlCQTAiLz4KPHBhdGggZD0iTTE2IDI0TDEyIDIwSDIwTDE2IDI0WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {partner.name}
                    </h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {partner.description}
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {t('government.partnerships.learn_more')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Government Contact */}
        <div className="bg-blue-600 rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">
            {t('government.contact.title')}
          </h3>
          <p className="text-blue-100 mb-4">
            {t('government.contact.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
            <div>
              <strong>{t('government.contact.email')}:</strong> support@farmermarket.gov.np
            </div>
            <div>
              <strong>{t('government.contact.phone')}:</strong> +977-1-4444-5555
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernmentPartnership;