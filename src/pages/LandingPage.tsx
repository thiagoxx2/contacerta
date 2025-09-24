import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Building, FileText, CheckCircle, ShieldCheck, Zap, LogIn, ArrowRight } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function LandingPage() {
  usePageTitle('ContaCerta - Gestão Financeira Inteligente');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (session) {
      navigate('/app/dashboard');
    } else {
      setAuthModalOpen(true);
    }
  };

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: 'Dashboard Intuitivo',
      description: 'Visão clara e completa das suas finanças em um só lugar.',
    },
    {
      icon: <Building className="w-8 h-8 text-blue-500" />,
      title: 'Gestão de Fornecedores',
      description: 'Cadastre e organize todos os seus fornecedores de forma eficiente.',
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      title: 'Controle de Documentos',
      description: 'Gerencie contas a pagar e receber com anexos e status detalhados.',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-blue-500" />,
      title: 'Relatórios Inteligentes',
      description: 'Exporte relatórios em PDF/CSV com base em caixa ou competência.',
    },
  ];

  const benefits = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      text: 'Segurança de dados com Supabase',
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      text: 'Interface rápida e moderna',
    },
    {
      icon: <LogIn className="w-6 h-6 text-red-500" />,
      text: 'Acesso de qualquer lugar',
    },
  ];

  return (
    <div className="bg-white text-gray-800">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">ContaCerta</span>
          </div>
          <button
            onClick={handleGetStarted}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            {session ? 'Acessar Dashboard' : 'Fazer Login'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative isolate overflow-hidden pt-32 sm:pt-48">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80caff] to-[#4f46e5] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            A gestão financeira do seu negócio, <span className="text-blue-600">finalmente organizada.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto"
          >
            Com o ContaCerta, você assume o controle total das suas contas a pagar e receber. Simplifique processos, gere relatórios inteligentes e tome decisões com confiança.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <button
              onClick={handleGetStarted}
              className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105"
            >
              Comece agora
            </button>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tudo que você precisa para uma gestão eficiente
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ferramentas poderosas em uma interface amigável.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-white shadow-md mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-base text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
          <div className="flex justify-center space-x-6">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center text-gray-300">
                {benefit.icon}
                <span className="ml-2 text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ContaCerta. Todos os direitos reservados. Criado com Dualite Alpha.
          </div>
        </div>
      </footer>
    </div>
  );
}
