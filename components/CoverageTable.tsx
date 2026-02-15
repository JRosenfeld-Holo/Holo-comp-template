import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Signal, ChevronDown, Filter, Zap, ShieldCheck } from 'lucide-react';
import { Section } from './Section';
import { coverageData, Network } from '../data/coverageData';

export const CoverageTable = () => {
    const [search, setSearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('All Countries');
    const [selectedRat, setSelectedRat] = useState('All Technologies');
    const [activeTab, setActiveTab] = useState<'contract' | 'self-service'>('contract');

    // Unique countries and technologies for filters
    const countries = useMemo(() => ['All Countries', ...new Set(coverageData.map(n => n.country))].sort(), []);
    const rats = useMemo(() => ['All Technologies', '5G', '4G LTE', 'LTE-M', 'NB-IoT', '3G', '2G'], []);

    const filteredData = useMemo(() => {
        return coverageData.filter(network => {
            const matchesSearch =
                network.carrier.toLowerCase().includes(search.toLowerCase()) ||
                network.country.toLowerCase().includes(search.toLowerCase()) ||
                network.mcc_mnc.includes(search);

            const matchesCountry = selectedCountry === 'All Countries' || network.country === selectedCountry;
            const matchesRat = selectedRat === 'All Technologies' || network.rats.includes(selectedRat);

            return matchesSearch && matchesCountry && matchesRat;
        });
    }, [search, selectedCountry, selectedRat]);

    return (
        <Section id="coverage" className="py-24 bg-brand-deep/50 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-lime/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">Connectivity</p>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white font-display">We've got you covered</h2>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-gray-400 font-light text-lg">
                        <div className="flex items-center gap-3"><Signal className="text-brand-lime w-5 h-5" /> 550+ networks</div>
                        <div className="flex items-center gap-3"><Globe className="text-brand-lime w-5 h-5" /> 190+ countries</div>
                        <div className="flex items-center gap-3"><Zap className="text-brand-lime w-5 h-5" /> Native performance</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white/5 p-1 rounded-2xl flex backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => setActiveTab('contract')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'contract' ? 'bg-brand-lime text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Contract networks
                        </button>
                        <button
                            onClick={() => setActiveTab('self-service')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'self-service' ? 'bg-brand-lime text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Self-service networks
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by network or country"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-lime/50 transition-colors"
                        />
                    </div>
                    <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-white appearance-none focus:outline-none focus:border-brand-lime/50 transition-colors cursor-pointer"
                        >
                            {countries.map(c => <option key={c} value={c} className="bg-brand-deep text-white">{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <select
                            value={selectedRat}
                            onChange={(e) => setSelectedRat(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-white appearance-none focus:outline-none focus:border-brand-lime/50 transition-colors cursor-pointer"
                        >
                            {rats.map(r => <option key={r} value={r} className="bg-brand-deep text-white">{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                </div>

                {/* Table Head */}
                <div className="bg-white/5 border border-white/10 rounded-t-3xl backdrop-blur-sm">
                    <div className="grid grid-cols-3 md:grid-cols-4 p-6 border-b border-white/10 text-gray-400 font-medium text-sm md:text-base font-display">
                        <div className="col-span-1 md:col-span-2">Network</div>
                        <div>Country</div>
                        <div className="hidden md:block">Technologies</div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, idx) => (
                                    <motion.div
                                        key={`${item.carrier}-${item.mcc_mnc}-${item.country}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx % 10 * 0.05 }}
                                        className="grid grid-cols-3 md:grid-cols-4 p-6 border-b border-white/5 last:border-0 items-center group hover:bg-white/[0.02] transition-all"
                                    >
                                        <div className="col-span-1 md:col-span-2">
                                            <div className="text-white font-bold text-lg font-display">{item.carrier}</div>
                                            <div className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{item.mcc_mnc}</div>
                                        </div>
                                        <div className="text-gray-300 font-medium">{item.country}</div>
                                        <div className="hidden md:flex flex-wrap gap-2">
                                            {item.rats.length > 0 ? item.rats.map(rat => (
                                                <span key={rat} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 tracking-wider">
                                                    {rat}
                                                </span>
                                            )) : (
                                                <span className="text-gray-600 text-xs italic">Request access</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-20 text-center text-gray-500 font-light text-xl">
                                    No networks found matching your search criteria.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="p-6 bg-white/[0.02] border-x border-b border-white/10 rounded-b-3xl text-center">
                    <p className="text-gray-500 text-sm">Showing {filteredData.length} of 550+ networks available globally.</p>
                </div>
            </div>
        </Section>
    );
};
