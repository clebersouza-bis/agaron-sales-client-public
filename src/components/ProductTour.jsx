import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './ProductTour.css';

const ProductTour = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Função para retornar os passos baseados no tipo e contexto
    const getSteps = useCallback((type) => {
        switch (type) {
            case 'quick':
                return [
                    {
                        element: '#sidebar-nav',
                        popover: {
                            title: 'Menu de Navegação',
                            description: 'Aqui você acessa as principais áreas do sistema: Propostas, Clientes e Produtos.',
                            position: 'right'
                        }
                    },
                    {
                        element: '#theme-toggle',
                        popover: {
                            title: 'Modo Claro/Escuro',
                            description: 'Prefere um visual diferente? Alterne entre o modo claro e escuro a qualquer momento aqui.',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#main-content',
                        popover: {
                            title: 'Área de Trabalho',
                            description: 'Onde a mágica acontece! Visualize e gerencie seus dados nesta área.',
                            position: 'top'
                        }
                    }
                ];
            case 'filters':
                return [
                    {
                        element: '#btn-toggle-filters',
                        popover: {
                            title: 'Expandir Filtros',
                            description: 'Clique aqui para abrir ou fechar as opções de busca avançada.',
                            position: 'bottom'
                        },
                        onHighlightStarted: (element) => {
                            const filterSection = document.querySelector('.filters-section');
                            if (filterSection && filterSection.classList.contains('collapsed')) {
                                element.click();
                            }
                        }
                    },
                    {
                        element: '#filter-search',
                        popover: {
                            title: 'Buscar por Título',
                            description: 'Procure por propostas usando palavras-chave ou títulos específicos.',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#filter-client',
                        popover: {
                            title: 'Filtrar por Cliente',
                            description: 'Visualize rapidamente todas as propostas vinculadas a um cliente específico.',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#filter-date',
                        popover: {
                            title: 'Faixa de Datas',
                            description: 'Defina um período para visualizar apenas os registros criados nesse intervalo.',
                            position: 'bottom'
                        }
                    }
                ];
            case 'table':
                return [
                    {
                        element: '#proposals-table thead',
                        popover: {
                            title: 'Tabela de Propostas',
                            description: 'Aqui estão todas as suas negociações. Vamos entender o que cada status significa.',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#col-status-gerencia',
                        popover: {
                            title: 'Aprovação Gerência',
                            description: 'Este é o status interno. Indica que a proposta está aguardando a validação da gerência da Agaron antes de seguir adiante.',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#col-status-proposta',
                        popover: {
                            title: 'Status Proposta',
                            description: 'Reflete a interação com o cliente. Após o cliente visualizar e aprovar o que foi enviado, este status muda para "Aprovado".',
                            position: 'bottom'
                        }
                    },
                    {
                        element: '#col-status-contrato',
                        popover: {
                            title: 'Status Contrato',
                            description: 'Acompanhe a assinatura: mostra se o contrato já foi enviado via DocuSign e se o cliente já assinou.',
                            position: 'bottom'
                        }
                    }
                ];
            case 'new-proposal':
                // Se estiver na listagem, o primeiro passo é o botão de Criar
                if (location.pathname === '/proposals' || location.pathname === '/') {
                    return [
                        {
                            element: '#btn-new-proposal',
                            popover: {
                                title: 'Criar Nova Proposta',
                                description: 'Clique aqui para iniciar o processo de criação de uma nova proposta. Vou te levar para a tela do formulário!',
                                position: 'left'
                            },
                            onNextClick: () => {
                                sessionStorage.setItem('pendingTour', 'new-proposal');
                                sessionStorage.setItem('pendingTourStep', '1');
                                navigate('/proposals/new');
                            }
                        }
                    ];
                }
                // Se já estiver na tela de criação, mostramos os passos detalhados
                return [
                    {
                        element: '#section-client-info',
                        popover: {
                            title: 'Informações do Cliente',
                            description: 'O sistema puxa o cliente automaticamente: comece a digitar o nome e escolha na lista. Caso não encontre, use o botão "+ Novo Cliente".',
                            position: 'top'
                        }
                    },
                    {
                        element: '#section-resources',
                        popover: {
                            title: 'Recursos e Serviços',
                            description: 'Defina as horas de implantação (dependendo de usuários e se haverá Menu ou IA). Note que o padrão é 15 Milhões de TOKENS e 15 GB de armazenamento.',
                            position: 'top'
                        }
                    },
                    {
                        element: '#section-status',
                        popover: {
                            title: 'Status e Acompanhamento',
                            description: 'Acompanhe o status da proposta, do contrato e defina o estágio da prospecção com uma data para o próximo follow-up.',
                            position: 'top'
                        }
                    },
                    {
                        element: '#section-price-summary',
                        popover: {
                            title: 'Resumo de Preço',
                            description: 'Confira o valor total, aplique descontos se necessário e veja o valor final calculado.',
                            position: 'top'
                        }
                    },
                    {
                        element: '#btn-submit-proposal',
                        popover: {
                            title: 'Pronto para Criar',
                            description: 'Tudo conferido? Agora é só clicar em "Criar Proposta" para finalizar!',
                            position: 'top'
                        }
                    }
                ];
            default:
                return [];
        }
    }, [location.pathname, navigate]);

    const startTour = useCallback((type, skipSteps = 0) => {
        setIsOpen(false);

        const steps = getSteps(type);
        if (!steps || steps.length === 0) return;

        const driverObj = driver({
            showProgress: true,
            nextBtnText: 'Próximo',
            prevBtnText: 'Anterior',
            doneBtnText: 'Finalizar',
            steps: steps,
            initialStep: skipSteps,
            onDestroyStarted: () => {
                sessionStorage.removeItem('pendingTour');
                sessionStorage.removeItem('pendingTourStep');
                driverObj.destroy();
            }
        });

        driverObj.drive();
    }, [getSteps]);

    // Efeito para retomar tours após navegação
    useEffect(() => {
        const pendingTour = sessionStorage.getItem('pendingTour');
        if (pendingTour) {
            // Pequeno delay para garantir que o DOM da nova página carregou
            const timer = setTimeout(() => {
                startTour(pendingTour, 0);
                sessionStorage.removeItem('pendingTour');
                sessionStorage.removeItem('pendingTourStep');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [location.pathname, startTour]);

    // Define quais tours aparecem baseados na página
    const isProposalsPage = location.pathname === '/proposals' || location.pathname === '/';
    const isNewProposalPage = location.pathname === '/proposals/new' || location.pathname.includes('/edit');

    return (
        <div className="product-tour-container">
            <button
                className={`tour-fab ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Dúvidas? Inicie um tutorial"
            >
                <span className="fab-icon">?</span>
            </button>

            {isOpen && (
                <div className="tour-menu">
                    <div className="tour-menu-header">
                        <h3>Tutoriais da Página</h3>
                        <button className="close-menu" onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className="tour-menu-content">
                        <button onClick={() => startTour('quick')} className="tour-option">
                            <span className="option-icon">🚀</span>
                            <div className="option-text">
                                <span className="option-title">Tour Rápido</span>
                                <span className="option-desc">Interface e visual</span>
                            </div>
                        </button>

                        {isProposalsPage && (
                            <>
                                <button onClick={() => startTour('filters')} className="tour-option">
                                    <span className="option-icon">🔍</span>
                                    <div className="option-text">
                                        <span className="option-title">Como Filtrar</span>
                                        <span className="option-desc">Aprenda a usar os filtros</span>
                                    </div>
                                </button>
                                <button onClick={() => startTour('table')} className="tour-option">
                                    <span className="option-icon">📊</span>
                                    <div className="option-text">
                                        <span className="option-title">Tabela de Propostas</span>
                                        <span className="option-desc">Entenda cada status</span>
                                    </div>
                                </button>
                            </>
                        )}

                        {(isProposalsPage || isNewProposalPage) && (
                            <button onClick={() => startTour('new-proposal')} className="tour-option">
                                <span className="option-icon">➕</span>
                                <div className="option-text">
                                    <span className="option-title">Nova Proposta</span>
                                    <span className="option-desc">Como criar uma venda</span>
                                </div>
                            </button>
                        )}

                        {!isProposalsPage && !isNewProposalPage && (
                            <div className="no-tours-msg">
                                Nenhum tutorial específico para esta página ainda.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductTour;
