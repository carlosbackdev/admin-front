import React, { useEffect, useState } from 'react';
import { leadsApi } from '../services/api';
import { Table } from '../components/ui/Table';
import { Card } from '../components/ui/Card';
import { Mail } from 'lucide-react';

const SOURCE_LABELS = {
    EARLY_ACCESS: 'Acceso anticipado',
    COMPATIBILITY: 'Compatibilidad',
};

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const response = await leadsApi.getAll();
            setLeads(response.data);
        } catch (error) {
            console.error('Failed to load leads', error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="mb-2">Leads</h1>
            <p className="text-sm text-zinc-400 mb-6">
                Interés registrado desde la web en productos todavía no disponibles (ordenador de a bordo).
            </p>

            <Card>
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Cargando leads...</div>
                ) : leads.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Todavía no hay leads registrados</div>
                ) : (
                    <Table headers={['Fecha', 'Nombre', 'Email', 'Moto', 'Origen', 'Producto', 'Mensaje']}>
                        {leads.map((lead) => (
                            <tr key={lead.id}>
                                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                                <td>{lead.name}</td>
                                <td>
                                    <a
                                        href={`mailto:${lead.email}`}
                                        className="flex items-center gap-2 text-blue-400 hover:underline"
                                    >
                                        <Mail size={14} />
                                        {lead.email}
                                    </a>
                                </td>
                                <td>
                                    {lead.motorcycleModel}
                                    {lead.motorcycleYear ? ` (${lead.motorcycleYear})` : ''}
                                </td>
                                <td>{SOURCE_LABELS[lead.source] || lead.source}</td>
                                <td>{lead.productSlug || '—'}</td>
                                <td className="max-w-xs truncate" title={lead.message || ''}>
                                    {lead.message || '—'}
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default Leads;
