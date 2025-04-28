// src/components/Marketplace/MarketplaceScreen.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import CategoryCarousel from './CategoryCarousel';
import ProductCard from './ProductCard';
import CartButton from './CartButton';
import CartScreen from './CartScreen';

// Mock data for marketplace
const mockCategories = [
  { id: 1, name: 'Design', icon: '🎨' },
  { id: 2, name: 'Marketing', icon: '📊' },
  { id: 3, name: 'Tecnologia', icon: '💻' },
  { id: 4, name: 'Finanças', icon: '💰' },
  { id: 5, name: 'Jurídico', icon: '⚖️' },
  { id: 6, name: 'Recursos Humanos', icon: '👥' },
  { id: 7, name: 'Vendas', icon: '🛒' },
  { id: 8, name: 'Educação', icon: '📚' },
];

const mockProducts = [
  {
    id: 1,
    title: 'Design de Logo Profissional',
    price: 299.90,
    supplier: 'DesignMasters',
    image: '/assets/images/logo_design.jpg',
    category: 'Design',
    description: 'Design de logotipo de alta qualidade para sua marca ou empresa.'
  },
  {
    id: 2,
    title: 'Campanha de Marketing Digital',
    price: 1499.90,
    supplier: 'MarketingPro',
    image: '/assets/images/marketing_campaign.jpg',
    category: 'Marketing',
    description: 'Campanha completa de marketing digital para aumentar sua presença online.'
  },
  {
    id: 3,
    title: 'Desenvolvimento de Website',
    price: 2999.90,
    supplier: 'TechSolutions',
    image: '/assets/images/web_development.jpg',
    category: 'Tecnologia',
    description: 'Criação de site responsivo e moderno para sua empresa.'
  },
  {
    id: 4,
    title: 'Consultoria Financeira',
    price: 899.90,
    supplier: 'FinancePro',
    image: '/assets/images/financial_consulting.jpg',
    category: 'Finanças',
    description: 'Consultoria especializada em finanças para otimizar seus investimentos.'
  },
  {
    id: 5,
    title: 'Assessoria Jurídica',
    price: 399.90,
    supplier: 'LegalAdvice',
    image: '/assets/images/legal_advice.jpg',
    category: 'Jurídico',
    description: 'Assessoria jurídica para empresas e profissionais.'
  },
  {
    id: 6,
    title: 'Identidade Visual Completa',
    price: 1899.90,
    supplier: 'BrandStudio',
    image: '/assets/images/visual_identity.jpg',
    category: 'Design',
    description: 'Criação de identidade visual completa para sua marca.'
  },
  {
    id: 7,
    title: 'SEO e Otimização de Conteúdo',
    price: 799.90,
    supplier: 'SEOMasters',
    image: '/assets/images/seo_optimization.jpg',
    category: 'Marketing',
    description: 'Otimização de SEO para melhorar o ranking do seu site.'
  },
  {
    id: 8,
    title: 'Sistema de Gestão Empresarial',
    price: 4999.90,
    supplier: 'ERPSolutions',
    image: '/assets/images/erp_system.jpg',
    category: 'Tecnologia',
    description: 'Sistema ERP completo para gestão do seu negócio.'
  },
];

const MarketplaceScreen = () => {
  const { darkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [displayedProducts, setDisplayedProducts] = useState(mockProducts);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products when category or search term changes
  useEffect(() => {
    let filtered = mockProducts;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setDisplayedProducts(filtered);
  }, [selectedCategory, searchTerm]);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName === selectedCategory ? null : categoryName);
  };

  const handleAddToCart = (product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    }
  };

  const handleCheckout = () => {
    // In a real app, this would navigate to checkout flow
    alert(`Redirecionando para checkout com ${cart.length} item(s) no carrinho!`);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Marketplace
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Encontre produtos e serviços para o seu negócio
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium`}>
              Novo
            </span>
            <button className={`p-1.5 rounded-full ${darkMode ? 'bg-[#333333] hover:bg-[#444444]' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Search bar */}
      <div className={`p-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'} shadow-sm`}>
        <div className={`relative rounded-lg ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'} flex items-center overflow-hidden`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Buscar produtos ou serviços..." 
            className={`w-full p-3 outline-none ${darkMode ? 'bg-[#333333] text-white placeholder-gray-500' : 'bg-gray-100 text-[#121212] placeholder-gray-500'}`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className={`pr-3 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Categories carousel */}
      <CategoryCarousel 
        categories={mockCategories} 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect}
        darkMode={darkMode}
      />
      
      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedProducts.length === 0 ? (
          <div className={`col-span-full flex flex-col items-center justify-center p-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
            <p className="text-sm opacity-75 text-center mt-1">
              Tente selecionar outra categoria ou buscar por outro termo
            </p>
          </div>
        ) : (
          displayedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => handleAddToCart(product)}
              darkMode={darkMode}
            />
          ))
        )}
      </div>
      
      {/* Cart button */}
      {cart.length > 0 && (
        <CartButton 
          itemCount={getTotalItems()} 
          onClick={() => setShowCart(true)}
          darkMode={darkMode}
        />
      )}
      
      {/* Cart modal */}
      {showCart && (
        <CartScreen 
          cart={cart} 
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveFromCart}
          onCheckout={handleCheckout}
          subtotal={getSubtotal()}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default MarketplaceScreen;