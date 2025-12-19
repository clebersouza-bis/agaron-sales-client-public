import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import ClientAutocomplete from '../components/ClientAutocomplete';
import ClientCreationModal from '../components/ClientCreationModal';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';

const schema = yup.object({
  title: yup.string().notRequired('Proposal title is required'),
  client: yup.object().required('Client is required').nullable(),
  numAgents: yup.number().min(0, 'Must be at least 0').required('Agents is required').integer(),
  numBoxes: yup.number().min(0, 'Must be at least 0').required('Boxes is required').integer(),
  numWhatsApp: yup.number().min(0, 'Must be at least 0').required('WhatsApp Channels is required').integer(),
  numInstagram: yup.number().min(0, 'Must be at least 0').required('Instagram Channels is required').integer(),
  numEmail: yup.number().min(0, 'Must be at least 0').required('Email Channels is required').integer(),
  numSms: yup.number().min(0, 'Must be at least 0').required('SMS Channels is required').integer(),
  hoursImplantation: yup.number().min(0, 'Must be at least 0').required('Implantation Hours is required').integer(),
  tokensIA: yup.number().min(0, 'Must be at least 0').required('AI Tokens is required'),
  storageGB: yup.number().min(0, 'Must be at least 0').required('Storage is required'),
  discountApplied: yup.number().min(0, 'Must be at least 0').max(100, 'Discount cannot exceed 100%').notRequired(),
  notes: yup.string().max(500, 'Notes cannot exceed 500 characters'),
  status: yup.string().oneOf(['Draft', 'Pendente', 'Aprovado', 'Rejeitado'], 'Invalid status'),
  proposalStatus: yup.string().oneOf(['Pendente', 'Aprovado', 'Rejeitado'], 'Invalid status'),
  contractStatus: yup.string().oneOf(['Pendente', 'Assinado', 'Rejeitado'], 'Invalid status'),
  prospectStatus: yup.string().oneOf(['Vendido', 'Quente', 'Morno', 'Frio', 'N/A'], 'Invalid status'),
  followUpDate: yup.date().notRequired(),
  dueDate: yup.number().min(1, 'Dia de vencimento incorreto').max(31, 'Dia de vencimento incorreto').required('Data de vencimento é obrigatória')
});

const ProposalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isSales } = useAuth();
  const [prices, setPrices] = useState({});
  const [total, setTotal] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState(null);
  const messageRef = useRef(null);
  const [clientCreationModalOpen, setClientCreationModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const isEditMode = Boolean(id);
  const { showSuccess, showError, showConfirm, showLoading, closeModal } = useModal();

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      client: null,
      numAgents: 0,
      numBoxes: 0,
      numWhatsApp: 0,
      numInstagram: 0,
      numEmail: 0,
      numSms: 0,
      hoursImplantation: 0,
      tokensIA: 0,
      storageGB: 0,
      discountApplied: 0,
      notes: '',
      status: 'Draft',
      proposalStatus: 'Pendente',
      contractStatus: 'Pendente',
      prospectStatus: 'N/A',
      followUpDate: null,
      dueDate: 0,
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchProposal = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/proposals/${id}`);
          setProposal(response.data);
          setSelectedClient(response.data.client);
          reset({
            title: response.data.title,
            client: response.data.client,
            numAgents: response.data.numAgents,
            numBoxes: response.data.numBoxes,
            numWhatsApp: response.data.numWhatsApp,
            numInstagram: response.data.numInstagram,
            numEmail: response.data.numEmail,
            numSms: response.data.numSms,
            hoursImplantation: response.data.hoursImplantation,
            tokensIA: response.data.tokensIA,
            storageGB: response.data.storageGB,
            discountApplied: response.data.discountApplied,
            notes: response.data.notes,
            status: response.data.status,
            proposalStatus: response.data.proposalStatus,
            contractStatus: response.data.contractStatus,
            prospectStatus: response.data.prospectStatus,
            followUpDate: response.data.followUpDate ? new Date(response.data.followUpDate).toISOString().split('T')[0] : null,
            dueDate: response.data.dueDate || 0
          });
          setTotal(response.data.totalProposal);
          setSubTotal(response.data.subTotalProposal);
        } catch (err) {
          setMessage('❌ Falha ao ler os dados da proposta. Por favor, tente novamente.');
        } finally {
          setLoading(false);
        }
      };
      fetchProposal();
    }
  }, [id, isEditMode, reset]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await api.get('/proposals/prices');
        const priceMap = response.data.reduce((acc, p) => {
          acc[p.product.name] = p;
          return acc;
        }, {});
        setPrices(priceMap);
      } catch (err) {
        setMessage('Erro no carregamento dos preços. Por favor, tente novamente.');
      }
    };
    fetchPrices();
  }, []);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setValue('client', client);
  };

  const handleClientCreated = (newClient) => {
    setSelectedClient(newClient);
    setValue('client', newClient);
    setClientCreationModalOpen(false);
  };

  useEffect(() => {
    const handleOpenModal = (event) => {
      setClientCreationModalOpen(true);
    };
    window.addEventListener('openClientCreationModal', handleOpenModal);
    return () => {
      window.removeEventListener('openClientCreationModal', handleOpenModal);
    };
  }, []);

  const formData = watch();
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      let calcTotal = 0;
      let calcSubTotal = 0;

      calcTotal += (formData.numAgents || 0) * (prices['Users Agents']?.unitPrice || 0);
      calcTotal += (formData.numBoxes || 0) * (prices['Box Numbers']?.unitPrice || 0);
      calcTotal += (formData.numWhatsApp || 0) * (prices['WhatsApp Channels']?.unitPrice || 0);
      calcTotal += (formData.numInstagram || 0) * (prices['Instagram Channels']?.unitPrice || 0);
      calcTotal += (formData.numEmail || 0) * (prices['Email Channels']?.unitPrice || 0);
      calcTotal += (formData.numSms || 0) * (prices['SMS Channels']?.unitPrice || 0);
      calcTotal += (formData.hoursImplantation || 0) * (prices['Set Up Account']?.unitPrice || 0) / 12;
      calcTotal += (formData.tokensIA || 0) * (prices['IA Tokens']?.unitPrice || 0);
      calcTotal += (formData.storageGB || 0) * (prices['Storage']?.unitPrice || 0);
      calcSubTotal = calcTotal;
      setSubTotal(calcSubTotal);

      const discountAmount = (calcTotal * (formData.discountApplied || 0)) / 100;
      setTotal(calcTotal - discountAmount);
    }
  }, [formData, prices, isEditMode]);

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      let response;
      const submitData = {
        ...data,
        totalProposal: total,
        subTotalProposal: subTotal,
        clientId: data.client?.id || data.client?._id,
        userSalesId: user?.id || user?._id,
      };

      if (isEditMode) {
        response = await api.put(`/proposals/${id}`, submitData);
        setMessage(`✅ Proposal "${response.data.title}" updated successfully!`);
      } else {
        response = await api.post('/proposals', {
          ...data,
          totalProposal: total,
          subTotalProposal: subTotal,
          client: data.client,
          userSalesId: user?.id || user?._id,
        });
        setMessage(`✅ Proposal "${response.data.title}" created successfully! Total: $${total.toFixed(2)}`);
        reset({
          title: '',
          client: null,
          numAgents: 0,
          numBoxes: 0,
          numWhatsApp: 0,
          numInstagram: 0,
          numEmail: 0,
          numSms: 0,
          hoursImplantation: 0,
          tokensIA: 0,
          storageGB: 0,
          discountApplied: 0,
          notes: '',
          status: 'Draft',
          proposalStatus: 'Pendente',
          contractStatus: 'Pendente',
          prospectStatus: 'N/A',
          followUpDate: null,
          dueDate: 0
        });
        setSelectedClient(null);
        setTotal(0);
        setSubTotal(0);
      }

      setTimeout(() => {
        messageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

      setTimeout(() => {
        navigate('/proposal');
      }, 2000);

    } catch (err) {
      setMessage(`❌ Erro ${isEditMode ? 'updating' : 'saving'} proposta. Por favor tente novamente.`);
      setTimeout(() => {
        messageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  const calculateLineTotal = (quantity, unitPrice) => {
    return (quantity || 0) * (unitPrice || 0);
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


  if (loading && isEditMode) {
    return (
      <div className="proposal-form-container">
        <div className="loading-spinner">Carregando dados da proposta...</div>
      </div>
    );
  }

  const handleDownloadProposalPdf = async (proposalId) => {
    try {
      setMessage('⏳ O pdf da Proposta está sendo gerado...');
      const response = await api.get(`/contract/proposal/${proposalId}/pdf`, {
        responseType: 'blob'
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Proposta_${selectedClient?.company}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('');

    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage('❌ Erro ao baixar PDF da proposta');
    }
  };

  const handleDownloadContractPdf = async (proposalId) => {
    try {
      setMessage('⏳ O pdf do Contrato está sendo gerado...');
      const response = await api.get(`/contract/contract/${proposalId}/pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrato_${selectedClient?.company}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('');

    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage('❌ Erro ao baixar PDF do contrato');
    }
  };

  return (
    <div className="proposal-form-container">
      <div className="proposal-header">
        <h1>{isEditMode ? 'Editar Proposta' : 'Criar Nova Proposta'}</h1>
        <p>{isEditMode ? 'Em modo de atualização de proposta' : 'Em modo de criação de proposta'}</p>
      </div>

      {message && (
        <div ref={messageRef} className={message.includes('✅') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}
      <div className="proposal-header">
        <div className="header-content2">
          {isEditMode && (
            <div className="header-actions">
              {formData.status === 'Aprovado' && (
                <div className="action-group">
                  <button
                    className="btn-proposal-form"
                    onClick={() => handleGenerateProposal(id, formData.client?.company)}
                    title="Enviar Proposta por e-mail"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10,9 9,9 8,9" />
                    </svg>
                    Enviar Proposta
                  </button>

                  {formData.proposalStatus === 'Aprovado' && (
                    <button
                      className="btn-contract-form"
                      onClick={() => handleGenerateContract(id, formData.client?.company)}
                      title="Enviar Contrato via DocuSign"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                      Enviar Contrato
                    </button>
                  )}
                </div>
              )}

              <div className="action-group">
                <button
                  className="btn-proposal-pdf-form"
                  onClick={() => handleDownloadProposalPdf(id)}
                  title="Baixar PDF da Proposta"
                >
                  📄 PDF Proposta
                </button>

                <button
                  className="btn-contract-pdf-form"
                  onClick={() => handleDownloadContractPdf(id)}
                  title="Baixar PDF do Contrato"
                >
                  📝 PDF Contrato
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="proposal-form" id="proposal-form">
        <div className="form-section" id="section-client-info">
          <div className="section-header">
            <div className="section-icon">📋</div>
            <h3>Informação Cliente</h3>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <ClientAutocomplete
                value={selectedClient}
                onChange={handleClientSelect}
                error={errors.client?.message}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">💬</div>
            <h3>Canais de comunicação</h3>
          </div>
          <div className="form-grid mobile-grid">
            <div className="form-group">
              <label htmlFor="numAgents">Usuários/Agentes</label>
              <input
                id="numAgents"
                type="number"
                placeholder="0"
                {...register('numAgents')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Users Agents']?.unitPrice)} por agent
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numAgents, prices['Users Agents']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numBoxes">Número Caixas</label>
              <input
                id="numBoxes"
                type="number"
                placeholder="0"
                {...register('numBoxes')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Box Numbers']?.unitPrice)} por caixa
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numBoxes, prices['Box Numbers']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numWhatsApp">WhatsApp</label>
              <input
                id="numWhatsApp"
                type="number"
                placeholder="0"
                {...register('numWhatsApp')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['WhatsApp Channels']?.unitPrice)} por channel
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numWhatsApp, prices['WhatsApp Channels']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numInstagram">Instagram</label>
              <input
                id="numInstagram"
                type="number"
                placeholder="0"
                {...register('numInstagram')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Instagram Channels']?.unitPrice)} por channel
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numInstagram, prices['Instagram Channels']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numEmail">Email</label>
              <input
                id="numEmail"
                type="number"
                placeholder="0"
                {...register('numEmail')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Email Channels']?.unitPrice)} por channel
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numEmail, prices['Email Channels']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numSms">SMS</label>
              <input
                id="numSms"
                type="number"
                placeholder="0"
                {...register('numSms')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['SMS Channels']?.unitPrice)} por channel
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.numSms, prices['SMS Channels']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section" id="section-resources">
          <div className="section-header">
            <div className="section-icon">🛠️</div>
            <h3>Recursos e Serviços</h3>
          </div>
          <div className="form-grid mobile-grid">
            <div className="form-group">
              <label htmlFor="hoursImplantation">Horas de implantação</label>
              <input
                id="hoursImplantation"
                type="number"
                placeholder="0"
                {...register('hoursImplantation')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Set Up Account']?.unitPrice)} por hora
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.hoursImplantation, prices['Set Up Account']?.unitPrice) / 12)}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tokensIA">IA Tokens (milhões)</label>
              <input
                id="tokensIA"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('tokensIA')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['IA Tokens']?.unitPrice)} por milhões
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.tokensIA, prices['IA Tokens']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="storageGB">Armazenamento (GB)</label>
              <input
                id="storageGB"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('storageGB')}
              />
              <div className="price-display">
                <div className="price-info">
                  <span className="unit-price">
                    {formatCurrency(prices['Storage']?.unitPrice)} por GB
                  </span>
                  <span className="line-total">
                    {formatCurrency(calculateLineTotal(formData.storageGB, prices['Storage']?.unitPrice))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">📝</div>
            <h3>Informação adicional</h3>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="notes">Anotações (Opcional)</label>
              <textarea
                id="notes"
                placeholder="Anotações (Opcional)..."
                {...register('notes')}
                rows="4"
              />
              <div className="char-counter">
                {500 - (formData.notes?.length || 0)} caracteres restantes
              </div>
            </div>
            <div className="form-group full-width">
              <label htmlFor="dueDate">Data de Vencimento (dia do mês)</label>
              <input
                id="dueDate"
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 15"
                {...register('dueDate')}
              />
              {errors.dueDate && <span className="error">{errors.dueDate.message}</span>}
            </div>
          </div>
        </div>

        <div className="form-section" id="section-status">
          <div className="section-header">
            <div className="section-icon">📊</div>
            <h3>Status e Acompanhamento</h3>
          </div>
          <div className="form-grid mobile-grid">
            <div className="form-group">
              <label htmlFor="proposalStatus">Status da Proposta</label>
              <select
                id="proposalStatus"
                {...register('proposalStatus')}
              >
                <option value="Pendente">Pendente</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
              {errors.proposalStatus && <span className="error">{errors.proposalStatus.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contractStatus">Status do Contrato</label>
              <select
                id="contractStatus"
                {...register('contractStatus')}
              >
                <option value="Pendente">Pendente</option>
                <option value="Assinado">Assinado</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
              {errors.contractStatus && <span className="error">{errors.contractStatus.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prospectStatus">Status do Prospect</label>
              <select
                id="prospectStatus"
                {...register('prospectStatus')}
              >
                <option value="N/A">N/A</option>
                <option value="Vendido">Vendido</option>
                <option value="Quente">Quente</option>
                <option value="Morno">Morno</option>
                <option value="Frio">Frio</option>
              </select>
              {errors.prospectStatus && <span className="error">{errors.prospectStatus.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="followUpDate">Data de Follow-up</label>
              <input
                id="followUpDate"
                type="date"
                {...register('followUpDate')}
              />
              {errors.followUpDate && <span className="error">{errors.followUpDate.message}</span>}
            </div>
          </div>
        </div>

        <div className="calculator-section" id="section-price-summary">
          <div className="section-header">
            <div className="section-icon">💰</div>
            <h3>Resumo de preço</h3>
          </div>

          <div className="calculator-totals mobile-totals">
            <div className="total-item subtotal">
              <strong>Subtotal</strong>
              <div className="amount subtotal">{formatCurrency(subTotal)}</div>
            </div>

            <div className="total-item discount">
              <strong>Desconto</strong>
              <div className="discount-input-group">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  {...register('discountApplied')}
                  className="discount-input"
                />
                <span className="discount-percent">%</span>
              </div>
              <div className="amount discount">
                -{formatCurrency((subTotal * (formData.discountApplied || 0)) / 100)}
              </div>
              <div className="discount-breakdown">
                {formData.discountApplied}% desconto aplicado
              </div>
            </div>

            <div className="total-item final">
              <strong>Total Final</strong>
              <div className="amount final">{formatCurrency(total)}</div>
              <div className="discount-breakdown">
                {formData.discountApplied ? `Após ${formData.discountApplied}% desconto` : 'Nenhum desconto aplicado'}
              </div>
            </div>
          </div>

          {isEditMode && isAdmin && (
            <div className="form-group admin-status">
              <label htmlFor="status">Status Aprovação Gerência</label>
              <select
                id="status"
                {...register('status')}
              >
                <option value="Draft">Draft</option>
                <option value="Pendente">Pendente</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
              {errors.status && <span className="error">{errors.status.message}</span>}
            </div>
          )}

          <div className="form-actions mobile-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/proposal')}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" id="btn-submit-proposal" disabled={loading}>
              {loading ? (isEditMode ? 'Atualizando...' : 'Criando...') : (isEditMode ? 'Atualizar Proposta' : 'Criar Proposta')}
            </button>
          </div>
        </div>
      </form>

      <ClientCreationModal
        isOpen={clientCreationModalOpen}
        onClose={() => setClientCreationModalOpen(false)}
        onClientCreated={handleClientCreated}
        initialData={{ company: '' }}
      />
    </div>
  );
};

export default ProposalForm;