import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';
import api from '../api';
import '../App.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { showSuccess, showError, showConfirm, showLoading, closeModal } = useModal();
    const { isAdmin } = useAuth();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [editingUser, setEditingUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        role: 'Sales',
        position: '',
        commission: 0,
        negotiationLimit: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            setError('Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

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

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            username: '',
            password: '',
            role: 'Sales',
            position: '',
            commission: 0,
            negotiationLimit: 0
        });
        setEditingUser(null);
        setShowUserForm(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        try {
            showLoading('Criando usuário...');
            await api.post('/auth/register', formData);

            closeModal();

            resetForm();
            await showSuccess('Usuário Criado', 'Usuário criado com sucesso.');

            fetchUsers();
        } catch (err) {
            closeModal();
            await showError(
                'Erro ao Criar Usuário',
                err.response?.data?.message || 'Falha ao criar usuário.'
            );
        }
    };


    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: '',
            role: user.role,
            position: user.position,
            commission: user.commission,
            negotiationLimit: user.negotiationLimit
        });
        setShowUserForm(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        try {
            showLoading('Atualizando usuário...');
            await api.put(`/users/${editingUser.id}`, formData);

            closeModal();
            resetForm();

            await showSuccess('Usuário Atualizado', 'Usuário atualizado com sucesso.');

            fetchUsers();
        } catch (err) {
            closeModal();
            await showError('Erro ao Atualizar Usuário', err.response?.data?.message || 'Falha ao atualizar usuário.');
        }
    };

    const handleDeleteUser = async (userId) => {
        const result = await showConfirm(
            'Excluir Usuário',
            'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
            'Sim, Excluir'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/users/${userId}`);
                await showSuccess('Usuário Excluído', 'Usuário excluído com sucesso.');
                fetchUsers();
            } catch (err) {
                await showError('Erro ao Excluir Usuário', 'Falha ao excluir usuário.');
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="users-container">
                <div className="loading-spinner">Carregando Usuários...</div>
            </div>
        );
    }

    return (
        <div className="users-container">
            <div className="users-header">
                <div className="header-title-section">
                    <h2>Gerenciamento de Usuários</h2>
                    <div className="results-count">
                        Mostrando {currentItems.length} de {filteredUsers.length} usuários
                    </div>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowUserForm(true)}
                >
                    Adicionar Novo Usuário
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {totalPages > 1 && (
                <div className="pagination-controls top">
                    <div className="pagination-info">
                        Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} de {totalItems} itens
                    </div>
                    <div className="pagination-items-per-page">
                        <label>Itens por página:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            )}

            {showUserForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</h2>
                            <button
                                className="btn-close"
                                onClick={resetForm}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nome <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Sobrenome <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Usuário <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        disabled={editingUser}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Senha {editingUser ? '(Deixe em branco para manter atual)' : <span className="required">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingUser}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Cargo/Papel <span className="required">*</span></label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Sales">Vendas</option>
                                        <option value="Manager">Gerente</option>
                                        <option value="Admin">Administrador</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Posição</label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        placeholder="ex: Representante de Vendas"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Comissão (%)</label>
                                    <input
                                        type="number"
                                        name="commission"
                                        value={formData.commission}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Limite de Negociação (R$)</label>
                                    <input
                                        type="number"
                                        name="negotiationLimit"
                                        value={formData.negotiationLimit}
                                        onChange={handleInputChange}
                                        step="100"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container">
                <div className="table-scroll-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="col-name">Nome</th>
                                <th className="col-username">Usuário</th>
                                <th className="col-role">Cargo/Papel</th>
                                <th className="col-position">Posição</th>
                                <th className="col-commission">Comissão</th>
                                <th className="col-limit">Limite Negociação</th>
                                <th className="col-created">Criado em</th>
                                <th className="col-status">Status</th>
                                <th className="col-actions">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(user => (
                                <tr key={user.id} className="user-row">
                                    <td className="col-name">
                                        <div className="user-name">
                                            {user.firstName} {user.lastName}
                                        </div>
                                    </td>
                                    <td className="col-username">{user.username}</td>
                                    <td className="col-role">
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="col-position">{user.position || '-'}</td>
                                    <td className="col-commission number">{user.commission}%</td>
                                    <td className="col-limit number">{formatCurrency(user.negotiationLimit)}</td>
                                    <td className="col-created date">{formatDate(user.createdAt)}</td>
                                    <td className="col-status">
                                        <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="col-actions">
                                        <div className="action-buttons">
                                            <button
                                                className="btn-update"
                                                onClick={() => handleEditUser(user)}
                                                title="Editar Usuário"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteUser(user.id)}
                                                title="Excluir Usuário"
                                                disabled={user.id === 'admin-001'}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {currentItems.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>Nenhum usuário encontrado</p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '16px' }}
                            onClick={() => setShowUserForm(true)}
                        >
                            Criar Primeiro Usuário
                        </button>
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
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;