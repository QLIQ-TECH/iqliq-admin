'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getInfluencers } from '@/api/services/onboarding.api';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
const formSchema = z.object({
    influencers: z
        .array(z.string())
        .min(1, 'Please select at least one influencer'),
});
const InfluencerSelector = ({ influencers: initialInfluencers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [influencers, setInfluencers] = useState(initialInfluencers);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
    const scrollContainerRef = useRef(null);
    const { updateData, data: onboardingData } = useOnboarding();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { influencers: onboardingData.influencerPreferances || [] },
    });
    const router = useRouter();
    // Fetch influencers based on search term
    useEffect(() => {
        const fetchInfluencers = async () => {
            setLoading(true);
            try {
                const response = await getInfluencers(debouncedSearchTerm, 1, 10);
                if (response.success) {
                    setInfluencers(response.data.influencers);
                    setCurrentPage(1);
                    setHasMore(response.data.pagination.hasNext);
                }
            }
            catch (error) {
                console.error('Error fetching influencers:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchInfluencers();
    }, [debouncedSearchTerm]);
    const loadMoreInfluencers = useCallback(async () => {
        if (loading || loadingMore || !hasMore)
            return;
        setLoadingMore(true);
        try {
            const response = await getInfluencers(debouncedSearchTerm, currentPage + 1, 10);
            if (response.success) {
                setInfluencers((prev) => [...prev, ...response.data.influencers]);
                setCurrentPage((prev) => prev + 1);
                setHasMore(response.data.pagination.hasNext);
            }
        }
        catch (error) {
            console.error('Error loading more influencers:', error);
        }
        finally {
            setLoadingMore(false);
        }
    }, [loading, loadingMore, hasMore, debouncedSearchTerm, currentPage]);
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer)
            return;
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
            if (isNearBottom && hasMore && !loading && !loadingMore) {
                loadMoreInfluencers();
            }
        };
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading, loadingMore, loadMoreInfluencers]);
    const onSubmit = (data) => {
        updateData({ influencerPreferances: data.influencers });
        router.push('/onboarding/welcome-onboarding');
    };
    return (<div className="w-full text-black">
      <h1 className="font-semibold text-3xl sm:text-4xl">
        Choose Your Influencers
      </h1>

      <div className="relative w-full mt-7">
        <Input type="text" placeholder="Search influencers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl font-semibold placeholder:text-[#00000066] pr-12 bg-[#F5F5F5] border-none py-5 px-4"/>
        {loading ? (<Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black animate-spin"/>) : (<Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black"/>)}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="influencers" render={({ field }) => (<FormItem>
                <FormLabel className="sr-only">Influencers</FormLabel>
                <div className="min-h-[1.25rem]">
                  <FormMessage className="text-red-500 mt-1"/>
                </div>
                <FormControl>
                  <div ref={scrollContainerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                    {influencers?.map((inf) => {
                const isSelected = field.value.includes(inf._id);
                return (<label key={inf._id} className="cursor-pointer w-full">
                          <div className={`flex items-center justify-between border rounded-xl px-4 py-3 transition ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:bg-gray-50'}`} onClick={() => {
                        if (isSelected) {
                            field.onChange(field.value.filter((i) => i !== inf._id));
                        }
                        else {
                            field.onChange([...field.value, inf._id]);
                        }
                    }}>
                            {inf?.profilePicture ? (<img src={inf.profilePicture} alt={inf.name} className="w-10 h-10 rounded-full object-cover"/>) : (<div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {inf.name ? inf.name.charAt(0).toUpperCase() : ''}
                              </div>)}
                            <div className="flex flex-col ml-3 flex-1 space-y-1">
                              <span className="font-medium">{inf.name}</span>
                              <div className="flex text-xs font-semibold gap-2">
                                <span>
                                  {inf?.followerCount
                        ? `${inf.followerCount} followers`
                        : 'No followers data'}
                                </span>
                              </div>
                            </div>

                            {isSelected ? (<Check className="w-5 h-5 p-1 rounded-full bg-blue-500 stroke-white"/>) : (<div className="w-5 h-5 border border-gray-400 rounded-full bg-white"/>)}
                          </div>
                        </label>);
            })}
                    
                    {/* Loading indicator at the bottom */}
                    {loadingMore && (<div className="col-span-full flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500"/>
                      </div>)}
                  </div>
                </FormControl>
              </FormItem>)}/>

          <div className="flex flex-row gap-4 mt-7">
            <Button type="button" className="w-1/2 bg-white rounded-3xl border py-5 border-blue-500 text-blue-500 hover:bg-blue-50 transition" onClick={() => router.push('/onboarding/choose-competitors')}>
              Back
            </Button>
            <Button type="submit" className="w-1/2 rounded-3xl py-5 bg-[#0082FF3D] text-[#0082FF] hover:bg-[#0082FF66] transition">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>);
};
export default InfluencerSelector;
