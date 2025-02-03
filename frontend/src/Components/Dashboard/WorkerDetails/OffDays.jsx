import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { fetchWorkerOffDays, createWorkerOffDays, deleteWorkerOffDay } from '../../../api/offDays';
import { motion, AnimatePresence } from 'framer-motion';

const OffDays = ({ workerId }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [reason, setReason] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [offDayToDelete, setOffDayToDelete] = useState(null);
    const queryClient = useQueryClient();

    // Fetch off days
    const { data: offDays, isLoading } = useQuery({
        queryKey: ['worker-off-days', workerId],
        queryFn: () => fetchWorkerOffDays(workerId)
    });

    // Add off days mutation
    const addOffDaysMutation = useMutation({
        mutationFn: (data) => createWorkerOffDays({
            workerId,
            ...data
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['worker-off-days', workerId]);
            toast.success('Neradni dani su uspešno dodati');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Došlo je do greške');
        }
    });

    // Delete off days mutation
    const deleteOffDaysMutation = useMutation({
        mutationFn: (offDay) => deleteWorkerOffDay({ workerId, offDayId: offDay.id }),
        onSuccess: () => {
            queryClient.invalidateQueries(['worker-off-days', workerId]);
            toast.success('Neradni dani su uspešno obrisani');
            setIsDeleteModalOpen(false);
            setOffDayToDelete(null);
        },
        onError: () => {
            toast.error('Došlo je do greške prilikom brisanja');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            toast.error('Molimo vas izaberite datume');
            return;
        }

        addOffDaysMutation.mutate({
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            reason
        });
    };

    const resetForm = () => {
        setStartDate(null);
        setEndDate(null);
        setReason('');
    };

    const handleDeleteClick = (offDay) => {
        setOffDayToDelete(offDay);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="w-full pt-6">
            <div className="px-4 flex flex-col gap-3">
                {/* Desktop prikaz */}
                <div className="hidden lg:block">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Period</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Razlog</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Akcije</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            Učitavanje...
                                        </td>
                                    </tr>
                                ) : offDays?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            Nema postavljenih neradnih dana
                                        </td>
                                    </tr>
                                ) : (
                                    offDays?.map((offDay) => (
                                        <tr 
                                            key={offDay.id}
                                            className="group hover:bg-gray-50/50 transition-all duration-200"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {format(new Date(offDay.start_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                    {offDay.start_date !== offDay.end_date && (
                                                        <>
                                                            {' - '}
                                                            {format(new Date(offDay.end_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 line-clamp-2">
                                                    {offDay.reason || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteClick(offDay)}
                                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 
                                                             bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Obriši
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobilni prikaz */}
                <div className="lg:hidden flex flex-col gap-3">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-4">Učitavanje...</div>
                    ) : offDays?.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">Nema postavljenih neradnih dana</div>
                    ) : (
                        offDays?.map((offDay) => (
                            <div
                                key={offDay.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {format(new Date(offDay.start_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                </div>
                                                {offDay.start_date !== offDay.end_date && (
                                                    <div className="text-sm text-gray-500">
                                                        do {format(new Date(offDay.end_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClick(offDay)}
                                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    {offDay.reason && (
                                        <p className="text-sm text-gray-500 mt-2">{offDay.reason}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Dugme za dodavanje */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 mt-1
                             bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl
                             transition-colors duration-200 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm font-medium">Dodaj neradne dane</span>
                </button>

                {/* Modal za dodavanje */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                                 onClick={() => setShowAddModal(false)} />
                            
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
                                    <div className="p-6">
                                        {/* Modal header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Dodaj neradne dane
                                                    </h3>
                                                    <p className="text-sm text-gray-500">Izaberite period i unesite razlog</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowAddModal(false);
                                                    resetForm();
                                                }}
                                                className="text-gray-400 hover:text-gray-500 transition-colors"
                                            >
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Modal body */}
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1.5">
                                                        Početni datum <span className="text-red-500">*</span>
                                                    </label>
                                                    <DatePicker
                                                        selected={startDate}
                                                        onChange={date => setStartDate(date)}
                                                        selectsStart
                                                        startDate={startDate}
                                                        endDate={endDate}
                                                        minDate={new Date()}
                                                        dateFormat="dd.MM.yyyy"
                                                        locale={sr}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                                                 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                        placeholderText="Izaberite datum"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1.5">
                                                        Krajnji datum <span className="text-red-500">*</span>
                                                    </label>
                                                    <DatePicker
                                                        selected={endDate}
                                                        onChange={date => setEndDate(date)}
                                                        selectsEnd
                                                        startDate={startDate}
                                                        endDate={endDate}
                                                        minDate={startDate}
                                                        dateFormat="dd.MM.yyyy"
                                                        locale={sr}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                                                 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                        placeholderText="Izaberite datum"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-700 mb-1.5">
                                                    Razlog (opciono)
                                                </label>
                                                <textarea
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                                             focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                    rows="3"
                                                    placeholder="Unesite razlog za neradne dane"
                                                />
                                            </div>

                                            {/* Modal footer */}
                                            <div className="flex justify-end gap-3 pt-6 border-t">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddModal(false);
                                                        resetForm();
                                                    }}
                                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                                             rounded-xl hover:bg-gray-50"
                                                >
                                                    Otkaži
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={addOffDaysMutation.isLoading}
                                                    className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl 
                                                             hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {addOffDaysMutation.isLoading ? 'Sačuvavanje...' : 'Sačuvaj'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal za brisanje */}
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                                 onClick={() => setIsDeleteModalOpen(false)} />
                            
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Brisanje neradnih dana
                                                    </h3>
                                                    <p className="text-sm text-gray-500">Ova akcija je nepovratna</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                className="text-gray-400 hover:text-gray-500 transition-colors"
                                            >
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600">
                                                Da li ste sigurni da želite da obrišete neradne dane za period:
                                                <br />
                                                <span className="font-medium text-gray-900">
                                                    {format(new Date(offDayToDelete?.start_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                    {offDayToDelete?.start_date !== offDayToDelete?.end_date && (
                                                        <>
                                                            {' - '}
                                                            {format(new Date(offDayToDelete?.end_date), 'dd. MMMM yyyy.', { locale: sr })}
                                                        </>
                                                    )}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                                         rounded-xl hover:bg-gray-50"
                                            >
                                                Otkaži
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteOffDaysMutation.mutate(offDayToDelete)}
                                                disabled={deleteOffDaysMutation.isLoading}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl 
                                                         hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deleteOffDaysMutation.isLoading ? 'Brisanje...' : 'Obriši'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OffDays; 