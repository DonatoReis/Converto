import React, { useState, useEffect } from 'react';
import { getScoreColor, getScoreLabel, getScore } from '../utils/serasaScore';

const SerasaScoreCard = ({ document, documentType, name, isExpanded = false, onClose }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(isExpanded);
  
  useEffect(() => {
    if (!document) return;
    
    const fetchScore = async () => {
      try {
        setLoading(true);
        const data = await getScore(document);
        setScoreData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Serasa score:', err);
        setError('Não foi possível obter a pontuação Serasa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScore();
  }, [document]);

  const toggleExpanded = () => setExpanded(!expanded);
  
  // Function to create ring progress for score visualization
  const calculateRingProperties = (score) => {
    const normalizedScore = score / 10; // Convert score (0-1000) to percentage (0-100)
    const circumference = 2 * Math.PI * 40; // Circle with radius 40
    const offset = circumference - (normalizedScore / 100) * circumference;
    
    return { offset, circumference };
  };
  
  if (!document) return null;
  
  return (
    <div className={`w-full rounded-lg overflow-hidden transition-all duration-300 ${
      expanded ? 'shadow-lg' : 'shadow'
    }`}>
      {/* Header */}
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        style={{ backgroundColor: scoreData?.color || '#f0f0f0' }}
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <div className="text-white font-medium flex flex-col">
            <span className="text-sm opacity-80">Score Serasa</span>
            <span className="text-lg">{name || 'Contato'}</span>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full p-1 bg-white bg-opacity-20 hover:bg-opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Score Visualization */}
      <div className={`bg-white transition-all duration-300 overflow-hidden ${
        expanded ? 'max-h-[600px]' : 'max-h-24'
      }`}>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          ) : (
            <>
              {/* Score Circle */}
              <div className="flex justify-center mb-4">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    {/* Score indicator */}
                    <circle
                      className="text-current"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke={scoreData?.color || '#ccc'}
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      style={{
                        strokeDasharray: calculateRingProperties(scoreData?.score || 0).circumference,
                        strokeDashoffset: calculateRingProperties(scoreData?.score || 0).offset,
                        transformOrigin: 'center',
                        transform: 'rotate(-90deg)',
                      }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{scoreData?.score || 0}</span>
                    <span className="text-xs text-gray-500">de 1000</span>
                  </div>
                </div>
              </div>
              
              {/* Score Label */}
              <div className="text-center mb-4">
                <span 
                  className="text-lg font-medium px-4 py-1 rounded-full" 
                  style={{ 
                    backgroundColor: scoreData?.color ? `${scoreData.color}20` : '#f0f0f0',
                    color: scoreData?.color || '#333'
                  }}
                >
                  {scoreData?.label || 'Indisponível'}
                </span>
              </div>
              
              {/* Expanded content */}
              {expanded && (
                <div className="mt-6 space-y-6">
                  {/* Document Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Informações</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Documento</div>
                        <div className="font-medium">{document}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tipo</div>
                        <div className="font-medium">{documentType}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Última atualização</div>
                        <div className="font-medium">
                          {scoreData?.lastUpdated ? new Date(scoreData.lastUpdated).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Factors */}
                  {scoreData?.riskFactors && scoreData.riskFactors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Fatores de Risco</h4>
                      <ul className="space-y-2">
                        {scoreData.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-center">
                            <span className="mr-2 text-red-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </span>
                            <span className="text-sm">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Opportunity Factors */}
                  {scoreData?.opportunityFactors && scoreData.opportunityFactors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Oportunidades</h4>
                      <ul className="space-y-2">
                        {scoreData.opportunityFactors.map((factor, index) => (
                          <li key={index} className="flex items-center">
                            <span className="mr-2 text-green-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            <span className="text-sm">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 pb-4 pt-2 flex justify-center">
          <button
            onClick={toggleExpanded}
            className="text-xs text-gray-500 flex items-center hover:text-gray-700"
          >
            {expanded ? (
              <>
                <span>Recolher</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Expandir</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerasaScoreCard;