import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api';
import { masks, validations } from '../utils/masks';

const ClientCreationModal = ({
    isOpen,
    onClose,
    onClientCreated,
    onClientUpdated,
    client,
    initialData = {},
    mode = 'create'
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
        defaultValues: {
            company: initialData.company || '',
            principalName: '',
            principalPosition: '',
            email: '',
            address: '',
            address2: '',
            city: '',
            state: '',
            zipCode: '',
            companyRegNumber: '',
            principalId: '',
            principalTaxId: ''
        }
    });

    const companyRegNumberValue = watch('companyRegNumber');
    const principalTaxIdValue = watch('principalTaxId');
    const zipCodeValue = watch('zipCode');

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && client) {
                reset({
                    id: client.id || '',
                    company: client.company || '',
                    principalName: client.principalName || '',
                    principalPosition: client.principalPosition || '',
                    email: client.email || '',
                    address: client.address || '',
                    address2: client.address2 || '',
                    city: client.city || '',
                    state: client.state || '',
                    zipCode: client.zipCode || '',
                    companyRegNumber: client.companyRegNumber || '',
                    principalId: client.principalId || '',
                    principalTaxId: client.principalTaxId || ''
                });
            } else {
                reset({
                    company: initialData.company || '',
                    principalName: '',
                    principalPosition: '',
                    email: '',
                    address: '',
                    address2: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    companyRegNumber: '',
                    principalId: '',
                    principalTaxId: ''
                });
            }
        }
    }, [isOpen, initialData, client, mode, reset]);

    useEffect(() => {
        if (companyRegNumberValue) {
            const maskedValue = masks.cnpj(companyRegNumberValue);
            if (maskedValue !== companyRegNumberValue) {
                setValue('companyRegNumber', maskedValue);
            }
        }
    }, [companyRegNumberValue, setValue]);

    useEffect(() => {
        if (principalTaxIdValue) {
            const maskedValue = masks.cpf(principalTaxIdValue);
            if (maskedValue !== principalTaxIdValue) {
                setValue('principalTaxId', maskedValue);
            }
        }
    }, [principalTaxIdValue, setValue]);

    useEffect(() => {
        if (zipCodeValue) {
            const maskedValue = masks.cep(zipCodeValue);
            if (maskedValue !== zipCodeValue) {
                setValue('zipCode', maskedValue);
            }
        }
    }, [zipCodeValue, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const cleanData = {
                ...data,
                companyRegNumber: data.companyRegNumber.replace(/\D/g, ''),
                principalTaxId: data.principalTaxId.replace(/\D/g, ''),
                zipCode: data.zipCode.replace(/\D/g, '')
            };

            let response;

            if (mode === 'edit' && client) {
                response = await api.put(`/clients/${client.id}`, cleanData);
                if (onClientUpdated) {
                    onClientUpdated(response.data);
                }
            } else {
                response = await api.post('/clients', cleanData);
                if (onClientCreated) {
                    onClientCreated(response.data);
                }
            }

            onClose();
        } catch (err) {
            console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} client:`, err);
            alert(`Error ${mode === 'edit' ? 'updating' : 'creating'} client. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateCPF = (value) => {
        if (!value) return 'CPF é obrigatório.';
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length !== 11) return 'CPF deve ter 11 dígitos.';
        if (!validations.isValidCPF(cleanValue)) return 'CPF inválido.';
        return true;
    };

    const validateCNPJ = (value) => {
        if (!value) return 'CNPJ é obrigatório.';
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length !== 14) return 'CNPJ deve ter 14 dígitos.';
        if (!validations.isValidCNPJ(cleanValue)) return 'CNPJ inválido.';
        return true;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Editar Cliente' : 'Criar Novo Cliente'}</h2>
                    <button type="button" className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nome da Empresa <span className="required">*</span></label>
                            <input
                                {...register('company', { required: 'Nome da empresa é obrigatório' })}
                                placeholder="Digite o nome da empresa"
                            />
                            {errors.company && <span className="error">{errors.company.message}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label>Endereço</label>
                            <input
                                {...register('address')}
                                placeholder="Endereço completo"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cidade</label>
                            <input
                                {...register('city')}
                                placeholder="Cidade"
                            />
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <input
                                {...register('state')}
                                placeholder="UF"
                                maxLength={2}
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>CEP</label>
                            <input
                                {...register('zipCode')}
                                placeholder="00000-000"
                                maxLength={9}
                            />
                        </div>

                        <div className="form-group">
                            <label>CNPJ <span className="required">*</span></label>
                            <input
                                {...register('companyRegNumber', {
                                    required: 'CNPJ é obrigatório.',
                                    validate: validateCNPJ
                                })}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                            />
                            {errors.companyRegNumber && <span className="error">{errors.companyRegNumber.message}</span>}
                        </div>
                    </div>

                    <div className="section-divider">Informações do Responsável</div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nome Completo <span className="required">*</span></label>
                            <input
                                {...register('principalName', { required: 'Nome do responsável é obrigatório.' })}
                                placeholder="Nome completo do responsável"
                            />
                            {errors.principalName && <span className="error">{errors.principalName.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                {...register('email', {
                                    required: 'Email do responsável é obrigatório.',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Email inválido"
                                    }
                                })}
                                placeholder="email@empresa.com"
                            />
                            {errors.email && <span className="error">{errors.email.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Cargo do Responsável</label>
                            <input
                                {...register('principalPosition')}
                                placeholder="ex: Diretor, Gerente"
                            />
                        </div>

                        <div className="form-group">
                            <label>RG do Responsável</label>
                            <input
                                {...register('principalId')}
                                placeholder="RG"
                            />
                        </div>

                        <div className="form-group">
                            <label>CPF do Responsável <span className="required">*</span></label>
                            <input
                                {...register('principalTaxId', {
                                    required: 'CPF do responsável é obrigatório.',
                                    validate: validateCPF
                                })}
                                placeholder="000.000.000-00"
                                maxLength={14}
                            />
                            {errors.principalTaxId && <span className="error">{errors.principalTaxId.message}</span>}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting
                                ? (mode === 'edit' ? 'Atualizando...' : 'Criando...')
                                : (mode === 'edit' ? 'Atualizar Cliente' : 'Criar Cliente')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientCreationModal;