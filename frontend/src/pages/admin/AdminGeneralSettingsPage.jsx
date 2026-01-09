import { useState } from 'react';
import AdminTabs from '../../components/AdminTabs';
import GeneralTab from './tabs/GeneralTab';
import AiTab from './tabs/AiTab';
import SecurityTab from './tabs/SecurityTab';
import SmtpTab from './tabs/SmtpTab';
import { Layout, Cpu, Shield, Mail } from 'lucide-react';

const AdminGeneralSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Layout },
        { id: 'ai', label: 'Inteligencia Artificial', icon: Cpu },
        { id: 'security', label: 'Seguridad', icon: Shield },
        { id: 'smtp', label: 'Correo SMTP', icon: Mail }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralTab />;
            case 'ai': return <AiTab />;
            case 'security': return <SecurityTab />;
            case 'smtp': return <SmtpTab />;
            default: return <GeneralTab />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ajustes del Sistema</h1>
                <p className="max-w-2xl text-sm text-gray-500">
                    Administra la configuración global, integraciones y parámetros de seguridad.
                </p>
            </div>

            <AdminTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default AdminGeneralSettingsPage;
