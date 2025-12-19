import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';
import api from '../api';
import '../App.css';

const Proposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const { showSuccess, showError, showConfirm, showLoading, closeModal } = useModal();
    const { user, isAdmin, isManager, isSales } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [proposalStatusFilter, setProposalStatusFilter] = useState('all');
    const [contractStatusFilter, setContractStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [salesPersonFilter, setSalesPersonFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const [clients, setClients] = useState([]);
    const [salesPeople, setSalesPeople] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [proposalsResponse, clientsResponse, usersResponse] = await Promise.all([
                    api.get('/proposals'),
                    api.get('/clients'),
                    (isAdmin() || isManager()) ? api.get('/users') : Promise.resolve({ data: [] })
                ]);

                setProposals(proposalsResponse.data);
                setFilteredProposals(proposalsResponse.data);
                setClients(clientsResponse.data);

                if (usersResponse.data) {
                    const salesUsers = usersResponse.data.filter(u =>
                        u.role === 'Sales' && u.isActive
                    );
                    setSalesPeople(salesUsers);
                }
            } catch (err) {
                setError('Failed to load data');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAdmin, isManager]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, proposalStatusFilter, contractStatusFilter, clientFilter, salesPersonFilter, dateRange, proposals]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, proposalStatusFilter, contractStatusFilter, clientFilter, salesPersonFilter, dateRange]);

    const applyFilters = () => {
        let filtered = [...proposals];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(proposal =>
                proposal.title?.toLowerCase().includes(term) ||
                proposal.client?.company?.toLowerCase().includes(term) ||
                proposal.salesPerson?.firstName?.toLowerCase().includes(term) ||
                proposal.salesPerson?.lastName?.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(proposal => proposal.status === statusFilter);
        }

        if (proposalStatusFilter !== 'all') {
            filtered = filtered.filter(proposal => proposal.proposalStatus === proposalStatusFilter);
        }

        if (contractStatusFilter !== 'all') {
            filtered = filtered.filter(proposal => proposal.contractStatus === contractStatusFilter);
        }

        if (clientFilter !== 'all') {
            filtered = filtered.filter(proposal => proposal.client?.id === parseInt(clientFilter));
        }

        if (salesPersonFilter !== 'all' && (isAdmin() || isManager())) {
            filtered = filtered.filter(proposal => proposal.salesPerson?.id === salesPersonFilter);
        }

        if (dateRange.start) {
            filtered = filtered.filter(proposal => {
                const proposalDate = new Date(proposal.createdAt);
                const startDate = new Date(dateRange.start);
                return proposalDate >= startDate;
            });
        }

        if (dateRange.end) {
            filtered = filtered.filter(proposal => {
                const proposalDate = new Date(proposal.createdAt);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                return proposalDate <= endDate;
            });
        }

        setFilteredProposals(filtered);
    };

    const totalItems = filteredProposals.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProposals.slice(indexOfFirstItem, indexOfLastItem);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setProposalStatusFilter('all');
        setContractStatusFilter('all');
        setClientFilter('all');
        setSalesPersonFilter('all');
        setDateRange({ start: '', end: '' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === '1900-01-01' || dateString === '0001-01-01' || dateString === '0001-01-01T00:00:00' || dateString === '1900-01-01T00:00:00') {
            return '-';
        }
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusBadge = (status) => {
        if (!status) return '-';
        const statusClass = `status-badge status-${status.toLowerCase()}`;
        if (status === "Assinado") {
            return <span className={statusClass}>{status} ✅</span>;
        }
        return <span className={statusClass}>{status}</span>;
    };

    const getStatusProspectBadge = (status) => {
        if (!status) return '-';
        const statusClass = `status-badge status-${status.toLowerCase()}`;
        if (status === "Vendido") {
            return <span className={statusClass}>{status} ✅</span>;
        }
        return <span className={statusClass}>{status}</span>;
    };

    const handleRowDoubleClick = (proposal) => {
        if (proposal.canEdit) {
            window.location.href = `/proposals/${proposal.id}/edit`;
        }
    };

    const handleGenerateProposal = async (proposalId, company) => {
        const result = await showConfirm(
            'Gerar Proposta',
            `Tem certeza que deseja gerar e enviar a proposta para ${company}?`,
            'Sim, Gerar Proposta'
        );

        if (result.isConfirmed) {
            try {
                setMessage('⏳ Gerando proposta...');
                showLoading('Gerando proposta...');

                const userId = user?.id || user?._id;
                const response = await api.post(`/contract/send-proposal/${proposalId}`, { userId });

                closeModal();
                await showSuccess(
                    'Proposta Gerada com Sucesso!',
                    'A proposta foi criada e enviada com sucesso.'
                );

                setMessage(`✅ Proposta criada e enviada com sucesso!`);

            } catch (err) {
                closeModal();
                await showError(
                    'Erro ao Gerar Proposta',
                    'Ocorreu um erro ao tentar gerar a proposta. Por favor, tente novamente.'
                );

                setMessage('❌ Erro na geração da proposta');
                console.error('Proposal generation error:', err);
            }
        }
    };

    const handleGenerateContract = async (proposalId, company) => {
        const result = await showConfirm(
            'Gerar Contrato',
            `Tem certeza que deseja gerar e enviar o contrato via DocuSign para ${company}?`,
            'Sim, Gerar Contrato'
        );

        if (result.isConfirmed) {
            try {
                setMessage('⏳ Gerando contrato...');
                showLoading('Gerando contrato...');
                const userId = user?.id || user?._id;
                const response = await api.post(`/contract/send-contract/${proposalId}`, { userId });

                closeModal();
                await showSuccess(
                    'Contrato Gerado com Sucesso!',
                    `Contrato criado e enviado via DocuSign. Envelope ID: ${response.data.envelopeId}`
                );

                setMessage(`✅ Contrato criado e enviado com sucesso via DocuSign! Envelope ID: ${response.data.envelopeId}`);

            } catch (err) {
                closeModal();
                await showError(
                    'Erro ao Gerar Contrato',
                    'Ocorreu um erro ao tentar gerar o contrato. Por favor, tente novamente.'
                );

                setMessage('❌ Erro ao gerar contrato');
                console.error('Contract generation error:', err);
            }
        }
    };

    const handleStatusUpdate = async (proposalId, newStatus) => {
        const result = await showConfirm(
            'Atualizar Status',
            `Tem certeza que deseja alterar o status de "aprovação gerência" para "${newStatus}"?`,
            'Sim, Atualizar'
        );

        if (result.isConfirmed) {
            try {
                await api.put(`/proposals/${proposalId}/status`, { status: newStatus });

                setProposals(prev => prev.map(p =>
                    p.id === proposalId ? { ...p, status: newStatus } : p
                ));

                await showSuccess('Status Atualizado', 'O status da proposta foi atualizado com sucesso.');

            } catch (err) {
                await showError('Erro ao Atualizar', 'Ocorreu um erro ao atualizar o status.');
                console.error('Status update error:', err);
            }
        }
    };

    const handleDeleteProposal = async (proposalId) => {
        const result = await showConfirm(
            'Excluir Proposta',
            'Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.',
            'Sim, Excluir'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/proposal/${proposalId}`);

                setProposals(prev => prev.filter(p => p.id !== proposalId));

                await showSuccess('Proposta Excluída', 'A proposta foi excluída com sucesso.');

            } catch (err) {
                await showError('Erro ao Excluir', 'Ocorreu um erro ao excluir a proposta.');
                console.error('Delete error:', err);
            }
        }
    };

    const getUniqueStatuses = (field) => {
        const statuses = proposals.map(p => p[field]).filter(Boolean);
        return [...new Set(statuses)];
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' ||
            statusFilter !== 'all' ||
            proposalStatusFilter !== 'all' ||
            contractStatusFilter !== 'all' ||
            clientFilter !== 'all' ||
            salesPersonFilter !== 'all' ||
            dateRange.start !== '' ||
            dateRange.end !== '';
    };

    if (loading) {
        return (
            <div className="proposals-container">
                <div className="loading-spinner">Carregando Propostas...</div>
            </div>
        );
    }

    return (
        <div className="proposals-container">
            <div className="proposals-header">
                <div className="header-title-section">
                    <h2>Propostas</h2>
                    <div className="results-count">
                        Mostrando {currentItems.length} de {filteredProposals.length} propostas
                        {filteredProposals.length !== proposals.length && ` (filtradas de ${proposals.length} totais)`}
                        {isSales() && ' (Suas propostas)'}
                    </div>
                </div>
                <button
                    className="btn-primary"
                    id="btn-new-proposal"
                    onClick={() => window.location.href = '/proposals/new'}
                >
                    Criar nova proposta
                </button>
            </div>

            {message && (
                <div className={message.includes('✅') || message.includes('⏳') ? 'success-message' : 'error-message'}>
                    {message}
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className={`filters-section ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="filters-header">
                    <div className="filters-title-section">
                        <h3>Filtros</h3>
                        {hasActiveFilters() && (
                            <span className="active-filters-indicator">
                                • Filtros Ativos
                            </span>
                        )}
                    </div>
                    <div className="filters-header-actions">
                        <button
                            className="btn-toggle-filters"
                            id="btn-toggle-filters"
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            title={filtersExpanded ? 'Recolher Filtros' : 'Expandir Filtros'}
                        >
                            {filtersExpanded ? '▲' : '▼'} Filtros
                        </button>
                        <button
                            className="btn-clear-filters"
                            onClick={clearFilters}
                            disabled={!hasActiveFilters()}
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>

                <div className="filters-content">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Buscar</label>
                            <input
                                id="filter-search"
                                type="text"
                                placeholder="Buscar por título, cliente ou vendedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Aprovação Gerência</label>
                            <select
                                id="filter-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos os Status</option>
                                {getUniqueStatuses('status').map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Status Proposta</label>
                            <select
                                value={proposalStatusFilter}
                                onChange={(e) => setProposalStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos os Status</option>
                                {getUniqueStatuses('proposalStatus').map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Status Contrato</label>
                            <select
                                value={contractStatusFilter}
                                onChange={(e) => setContractStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos os Status</option>
                                {getUniqueStatuses('contractStatus').map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Cliente</label>
                            <select
                                id="filter-client"
                                value={clientFilter}
                                onChange={(e) => setClientFilter(e.target.value)}
                            >
                                <option value="all">Todos os Clientes</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.company}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(isAdmin() || isManager()) && (
                            <div className="filter-group">
                                <label>Vendedor</label>
                                <select
                                    value={salesPersonFilter}
                                    onChange={(e) => setSalesPersonFilter(e.target.value)}
                                >
                                    <option value="all">Todos os Vendedores</option>
                                    {salesPeople.map(salesPerson => (
                                        <option key={salesPerson.id} value={salesPerson.id}>
                                            {salesPerson.firstName} {salesPerson.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="filter-group date-range-group">
                            <label>Data de Criação</label>
                            <div className="date-inputs" id="filter-date">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    placeholder="Data inicial"
                                />
                                <span className="date-separator">até</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    placeholder="Data final"
                                />
                            </div>
                        </div>
                    </div>

                    {hasActiveFilters() && (
                        <div className="active-filters">
                            {searchTerm && (
                                <span className="active-filter-tag">
                                    Busca: "{searchTerm}"
                                    <button onClick={() => setSearchTerm('')}>×</button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="active-filter-tag">
                                    Status: {statusFilter}
                                    <button onClick={() => setStatusFilter('all')}>×</button>
                                </span>
                            )}
                            {proposalStatusFilter !== 'all' && (
                                <span className="active-filter-tag">
                                    Status Proposta: {proposalStatusFilter}
                                    <button onClick={() => setProposalStatusFilter('all')}>×</button>
                                </span>
                            )}
                            {contractStatusFilter !== 'all' && (
                                <span className="active-filter-tag">
                                    Status Contrato: {contractStatusFilter}
                                    <button onClick={() => setContractStatusFilter('all')}>×</button>
                                </span>
                            )}
                            {clientFilter !== 'all' && (
                                <span className="active-filter-tag">
                                    Cliente: {clients.find(c => c.id === parseInt(clientFilter))?.company}
                                    <button onClick={() => setClientFilter('all')}>×</button>
                                </span>
                            )}
                            {salesPersonFilter !== 'all' && (isAdmin() || isManager()) && (
                                <span className="active-filter-tag">
                                    Vendedor: {salesPeople.find(s => s.id === salesPersonFilter)?.firstName}
                                    <button onClick={() => setSalesPersonFilter('all')}>×</button>
                                </span>
                            )}
                            {(dateRange.start || dateRange.end) && (
                                <span className="active-filter-tag">
                                    Período: {dateRange.start || 'Início'} a {dateRange.end || 'Fim'}
                                    <button onClick={() => setDateRange({ start: '', end: '' })}>×</button>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="proposals-table-container">
                <div className="table-scroll-wrapper">
                    <table className="proposals-table" id="proposals-table">
                        <thead>
                            <tr>
                                <th className="col-title">ID</th>
                                <th className="col-client">Cliente</th>
                                {(isAdmin() || isManager()) && <th className="col-salesperson">Vendedor</th>}
                                <th className="col-prospection">Prospecção</th>
                                <th className="col-subtotal">Subtotal</th>
                                <th className="col-discount">Desconto</th>
                                <th className="col-total">Total</th>
                                <th className="col-status" id="col-status-gerencia">Aprovação Gerência</th>
                                <th className="col-proposal-status" id="col-status-proposta">Status Proposta</th>
                                <th className="col-contract-status" id="col-status-contrato">Status Contrato</th>
                                <th className="col-created">Criação</th>
                                <th className="col-followup">Follow up</th>
                                <th className="col-approval">Data Ap. Gerência</th>
                                <th className="col-actions">Ações</th>
                                <th className="col-actions">Documentos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(proposal => (
                                <tr
                                    key={proposal.id}
                                    className="proposal-row"
                                    onDoubleClick={() => handleRowDoubleClick(proposal)}
                                    style={{ cursor: proposal.canEdit ? 'pointer' : 'default' }}
                                >
                                    <td className="col-title">
                                        <div className="table-content text-ellipsis" title={proposal.id}>
                                            {proposal.id}
                                        </div>
                                    </td>

                                    <td className="col-client">
                                        <span className="table-content text-ellipsis" title={proposal.client?.company}>
                                            {proposal.client?.company || '-'}
                                        </span>
                                    </td>

                                    {(isAdmin() || isManager()) && (
                                        <td className="col-salesperson">
                                            <span className="table-content">
                                                {proposal.salesPerson?.firstName || '-'}
                                            </span>
                                        </td>
                                    )}

                                    <td className="col-prospection">
                                        <span className="table-content">
                                            {getStatusProspectBadge(proposal.prospectStatus) || '-'}
                                        </span>
                                    </td>

                                    <td className="col-subtotal">
                                        <span className="table-content number">
                                            {formatCurrency(proposal.subTotalProposal)}
                                        </span>
                                    </td>

                                    <td className="col-discount">
                                        <span className="table-content number">
                                            {formatCurrency(
                                                proposal.discountApplied ?
                                                    (proposal.subTotalProposal * proposal.discountApplied) / 100 : 0
                                            )}
                                        </span>
                                    </td>

                                    <td className="col-total">
                                        <span className="table-content number">
                                            {formatCurrency(proposal.totalProposal)}
                                        </span>
                                    </td>

                                    <td className="col-status">
                                        <span className="table-content">
                                            {getStatusBadge(proposal.status)}
                                        </span>
                                    </td>

                                    <td className="col-proposal-status">
                                        <span className="table-content">
                                            {getStatusBadge(proposal.proposalStatus)}
                                        </span>
                                    </td>

                                    <td className="col-contract-status">
                                        <span className="table-content">
                                            {getStatusBadge(proposal.contractStatus)}
                                        </span>
                                    </td>

                                    <td className="col-created">
                                        <span className="table-content date">
                                            {formatDate(proposal.createdAt)}
                                        </span>
                                    </td>

                                    <td className="col-followup">
                                        <span className="table-content date">
                                            {formatDate(proposal.followUpDate)}
                                        </span>
                                    </td>

                                    <td className="col-approval">
                                        <span className="table-content date">
                                            {formatDate(proposal.approvalDate)}
                                        </span>
                                    </td>

                                    <td className="col-actions">
                                        <div className="action-buttons">
                                            {proposal.canEdit && (
                                                <button
                                                    className="btn-update"
                                                    onClick={() => window.location.href = `/proposals/${proposal.id}/edit`}
                                                    title="Editar Proposta"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                            )}

                                            {(isAdmin() || isManager()) && (
                                                <button
                                                    className="btn-status"
                                                    onClick={() => handleStatusUpdate(proposal.id, 'Aprovado')}
                                                    title="Aprovar Proposta"
                                                    disabled={proposal.status === 'Aprovado'}
                                                >
                                                    ✓
                                                </button>
                                            )}

                                            {(isAdmin() || isManager()) && (
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteProposal(proposal.id)}
                                                    title="Excluir Proposta"
                                                >
                                                    🗑️
                                                </button>
                                            )}

                                        </div>
                                    </td>

                                    <td className="col-actions">
                                        <div className="action-buttons">

                                            {proposal.status === 'Aprovado' && (
                                                <button
                                                    className="btn-proposal"
                                                    onClick={() => handleGenerateProposal(proposal.id, proposal.client?.company)}
                                                    title="Enviar Proposta por e-mail"
                                                >Proposta
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14,2 14,8 20,8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                        <polyline points="10,9 9,9 8,9" />
                                                    </svg>
                                                </button>

                                            )}
                                            {proposal.proposalStatus === 'Aprovado' && (
                                                <button
                                                    className="btn-contract"
                                                    onClick={() => handleGenerateContract(proposal.id, proposal.client?.company)}
                                                    title="Enviar Contrato por DocuSign"
                                                >Contrato
                                                    📄
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {currentItems.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>
                            {proposals.length === 0
                                ? "Nenhuma proposta encontrada"
                                : "Nenhuma proposta corresponde aos filtros aplicados"
                            }
                        </p>
                        {proposals.length === 0 ? (
                            <button
                                className="btn-primary"
                                style={{ marginTop: '16px' }}
                                onClick={() => window.location.href = '/proposals/new'}
                            >
                                Crie sua primeira proposta
                            </button>
                        ) : (
                            <button
                                className="btn-secondary"
                                style={{ marginTop: '16px' }}
                                onClick={clearFilters}
                            >
                                Limpar Filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination-controls bottom">
                    <div className="pagination-info">
                        Página {currentPage} de {totalPages} • {totalItems} itens no total
                    </div>

                    <div className="pagination-navigation">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                        >
                            ««
                        </button>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            «
                        </button>

                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            »
                        </button>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            »»
                        </button>
                    </div>

                    <div className="pagination-items-per-page">
                        <label>Itens por página:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proposals;