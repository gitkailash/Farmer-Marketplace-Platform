import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, Star, Percent } from 'lucide-react';
import { useAppTranslation } from '../contexts/I18nProvider';

interface MarketStatisticsProps {
  className?: string;
}

interface StatisticItem {
  id: string;
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
}

export const MarketStatistics: React.FC<MarketStatisticsProps> = ({ 
  className = '' 
}) => {
  const { t } = useAppTranslation('common');
  const [animatedValues, setAnimatedValues] = useState<{ [key: string]: number }>({});

  // Mock statistics - in real app, these would come from API
  const statistics: StatisticItem[] = [
    {
      id: 'farmers',
      value: '15,847',
      label: t('statistics.farmers_registered'),
      icon: Users,
      trend: { value: '+12%', isPositive: true },
      color: 'text-green-600'
    },
    {
      id: 'buyers',
      value: '8,234',
      label: t('statistics.active_buyers'),
      icon: ShoppingCart,
      trend: { value: '+8%', isPositive: true },
      color: 'text-blue-600'
    },
    {
      id: 'transactions',
      value: '₹2.4 Cr',
      label: t('statistics.total_transactions'),
      icon: DollarSign,
      trend: { value: '+34%', isPositive: true },
      color: 'text-purple-600'
    },
    {
      id: 'products',
      value: '45,678',
      label: t('statistics.products_listed'),
      icon: TrendingUp,
      trend: { value: '+18%', isPositive: true },
      color: 'text-orange-600'
    },
    {
      id: 'satisfaction',
      value: '4.8/5',
      label: t('statistics.customer_satisfaction'),
      icon: Star,
      trend: { value: '+0.3', isPositive: true },
      color: 'text-yellow-600'
    },
    {
      id: 'income_increase',
      value: '34%',
      label: t('statistics.farmer_income_increase'),
      icon: Percent,
      trend: { value: '+5%', isPositive: true },
      color: 'text-emerald-600'
    }
  ];

  // Animate numbers on mount
  useEffect(() => {
    const animateNumbers = () => {
      statistics.forEach((stat, index) => {
        setTimeout(() => {
          const numericValue = parseFloat(stat.value.replace(/[^\d.]/g, ''));
          if (!isNaN(numericValue)) {
            let current = 0;
            const increment = numericValue / 50; // 50 steps
            const timer = setInterval(() => {
              current += increment;
              if (current >= numericValue) {
                current = numericValue;
                clearInterval(timer);
              }
              setAnimatedValues(prev => ({
                ...prev,
                [stat.id]: current
              }));
            }, 20);
          }
        }, index * 100);
      });
    };

    animateNumbers();
  }, []);

  const formatAnimatedValue = (stat: StatisticItem, animatedValue: number): string => {
    if (stat.id === 'transactions') {
      return `₹${(animatedValue / 10000000).toFixed(1)} Cr`;
    } else if (stat.id === 'satisfaction') {
      return `${animatedValue.toFixed(1)}/5`;
    } else if (stat.id === 'income_increase') {
      return `${Math.round(animatedValue)}%`;
    } else {
      return Math.round(animatedValue).toLocaleString();
    }
  };

  return (
    <section className={`py-12 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('statistics.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('statistics.subtitle')}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statistics.map((stat) => {
            const IconComponent = stat.icon;
            const animatedValue = animatedValues[stat.id] || 0;
            
            return (
              <div 
                key={stat.id}
                className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gray-50`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.trend && (
                    <div className={`text-sm font-medium ${
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend.isPositive ? '↗' : '↘'} {stat.trend.value}
                    </div>
                  )}
                </div>
                
                <div className="mb-2">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {animatedValue > 0 ? formatAnimatedValue(stat, animatedValue) : stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
                
                {stat.trend && (
                  <div className="text-xs text-gray-500">
                    {t('statistics.trend_period')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Impact Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {t('statistics.impact.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹12.5 Cr
              </div>
              <div className="text-sm text-gray-600">
                {t('statistics.impact.farmer_earnings')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                25%
              </div>
              <div className="text-sm text-gray-600">
                {t('statistics.impact.cost_reduction')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                98.5%
              </div>
              <div className="text-sm text-gray-600">
                {t('statistics.impact.transaction_success')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketStatistics;